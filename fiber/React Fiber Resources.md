# React Fiberメモ

```javascript
import { StrictMode } from "react";
import ReactDOM from "react-dom";

import App from "./App";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  rootElement
);
```

現在のReact-DomはLegacy Mode と呼ばれている。React Dom を読むと Legacy, New が混在しているのがわかるが、コンカレントモード以外を追う時はLegacyとつく方を中心に読んでいく。

https://reactjs.org/docs/concurrent-mode-adoption.html#migration-step-blocking-mode



React Dom は整理がついていないから、コードを古いAPIと新しいAPIに分割された。

ReactDOMRoot.js : 新旧で共有された実装がある

ReactDOMLegacy.js : Legacy Mode の実装が置いてある。幾らかbatch, hydrationのコードも置いてあるが、それらはConcurrent Mode では使われていない。

> I find it hard to navigate `ReactDOM.js`. It's long, mixes public API with implementation details, and mixes some injection with old APIs with new ones. It's hard to tell what's being used only by the old code, and what's only needed for legacy (or missing in modern code).

https://github.com/facebook/react/pull/17331



readctDOM.render()は差分を検出し、その後DOMに書き込んでいる。

> コンポーネントが更新される場合、インスタンスは同じままとなり、レンダー間で state は保持されます。React は対応するコンポーネントのインスタンスの props を新しい要素に合うように更新し、`UNSAFE_componentWillReceiveProps()`、`UNSAFE_componentWillUpdate()` および `componentDidUpdate()` を対応するインスタンスに対して呼び出します。
>
> 次に、`render()` メソッドが呼ばれ、差分アルゴリズムが再帰的に前の結果と新しい結果を処理します。

https://ja.reactjs.org/docs/reconciliation.html

「ReactがFiberでコンポーネントのツリーを歩くためにリンクリストを使用する方法と理由について」

https://medium.com/react-in-depth/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-67f1014d0eb7

React fiber がブロッキングをしないコードデモ（D）

https://github.com/facebook/react/issues/19804#issuecomment-690293041





https://github.com/facebook/react/issues/18141



React Dom のファイル構成はこんなかんじ。

Instead, in my approach the default index.js exports all exports. This allows Flow to check and tests based on flags to get all features. Then I use a file extension scheme to fork the exports based on the four build types we need.

```
.modern.fb.js - experimental FB builds
.classic.fb.js - stable FB builds
.experimental.js - experimental npm builds
.stable.js - stable npm builds
```

https://github.com/facebook/react/pull/18106



WorkPhaseはupdate, render, commit phaseの列挙型だが、実際のところこれらの "phase" は入れ子状になるので使うことが難しいからだ。

ExecutionContextはWorkPhaseを別の概念で置き換える。ExecutionContext! 

> WorkPhase is an enum that represents the currently executing phase of the React update -> render -> commit cycle. However, in practice, it's hard to use because different "phases" can be nested inside each other. For example, the commit phase can be nested inside the "batched phase."

> This replaces WorkPhase with a different concept: ExecutionContext. ExecutionContext is a bitmask instead of an enum. It represents a stack of React entry points. For example, when batchedUpdates is called from inside an effect, the ExecutionContext is BatchedContext | CommitContext.



# Technical description of Lanes

This is not a comprehensive description. That would take up many pages. What I've written here is a brief overview intended to help React team members translate from the old model (Expiration Times) to the new one (Lanes). I can write a longer technical document once more of follow-up steps done.

これは包括的な記述ではありません、包括的な記述は多くのページを必要とします。ここでは簡潔な概略を示すことでReactチームのメンバーが旧モデル(Expiration Times)から新モデル(Lanes)に移行するのを助けることを目的としています。I can write a longer technical document once more of follow-up steps done.　続く開発ステップが終われば、より長い技術ドキュメントをもう一度書くことができます。

There are two primary advantages of the Lanes model over the Expiration Times model:

- Lanes decouple the concept of task prioritization ("Is task A higher priority than task B?") from task batching ("Is task A part of this group of tasks?").
- Lanes can express many distinct task threads with a single, 32-bit data type.

Lanes モデルが Expiration Times モデルより優れている点は、主に2つあります。

In the old model, to decide whether to include a given unit of work in the batch that's being worked on, we would compare their relative priorities:

```
const isTaskIncludedInBatch = priorityOfTask >= priorityOfBatch;
```

旧モデルでは、あるworkユニットを作業中のバッチに含めるか決めるために、バッチとworkの相対的な優先順位を比較していました。

This worked because of a constraint we imposed where lower priority tasks were not allowed to complete unless higher priority tasks are also included. Given priorities A > B > C, you couldn't work on B without also working on A; nor could you work on C without working on both B and A.

これがうまくいっていたのは、低い優先度のタスクは、より高い優先度のタスクが含まれていなければ完了できないという制約を課していたからです。優先順位 A > B > C のとき、A をやらずに  B に取り組むことは出来ませんし、A と B の両方をやらずに C に取り組むことをできません。

This constraint was designed before Suspense was a thing, and it made some sense in that world. When all your work is CPU bound, there's not much reason to work on tasks in any order other than by their priority. But when you introduce tasks that are IO-bound (i.e. Suspense), you can have a scenario where a higher priority IO-bound task blocks a lower-priority CPU-bound task from completing.

この制約はサスペンスが登場する前に設計されたもので、そのときは意味がありました。作業がすべてCPUバウンドであれば、優先度以外の順番でタスクに取り組む理由はあまりありません。しかしIOバウンド (すなわちサスペンス) のタスクを導入すると、IOバウンドで高優先度のタスクが低優先度のCPUバウンドのタスクの完了を妨げるということがありえます。

A similar flaw of Expiration Times is that it's limited in how we can express a group of multiple priority levels.

Expiration Timesの同様の欠点は、複数の優先度グループを表現する方法が限られていることです。

Using a Set object isn't practical, in terms of either memory or computation — the existence checks we're dealing with are extremely pervasive, so they need to be fast and use as little memory as possible.

Set object を使うことはメモリーや計算の観点から実践的ではない -- 我々が取り組む存在チェックはどこにでもあるため、そのチェックは高速でなるべく省メモリな必要があります。

As a compromise, often what we'd do instead is maintain a range of priority levels:

```javascript
const isTaskIncludedInBatch = taskPriority <= highestPriorityInRange && taskPriority >= lowestPriorityInRange;
```

妥協の結果、セットの代わりに、優先度レベルの範囲を維持することが多いです。

Setting aside that this requires two separate fields, even this is quite limiting in its expressiveness. You can express a closed, continuous range of tasks. But you can't represent a finite set of distinct tasks. For example, given a range of tasks, how do you remove a task that lies in the middle of the range? Even in cases where we had designed a decent workaround, reasoning about groups of tasks this way became extremely confusing and prone to regressions.

2つの独立したフィールドを設定することは措いても、これはかなり表現力が限定的です。閉じて連続的なタスクの範囲を表現することはできます。しかし別々のタスクの有限[finite]セットを表現することはできません。たとえば、タスクの範囲があるとき、真ん中の優先度のタスクをどうやって除去しますか？ちゃんとした回避策を用意したとしても、このようにタスクのグループを推論することは、ひどい混乱を生み出し、prone to regressions[逆行の傾向がある]。

At first by design, but then more by accident, the old model coupled the two concepts of 1) prioritization and 2) batching into a single data type. We were limited in our ability to express one except in terms that affected the other.

当初、意図的に、しかし以降はby accident[誤って]、1) 優先度 2) バッチング という2つの概念を1つの概念にまとめていました。我々は、片方の概念に影響しない言葉でもう片方の概念を表現することができませんでした。

In the new model, we have decoupled those two concepts. Groups of tasks are instead expressed not as relative numbers, but as bitmasks:

```
const isTaskIncludedInBatch = (task & batchOfTasks) !== 0;
```

新しいモデルでは、この2つの概念を切り離します。タスクのグループは、相対的数値ではなく、ビットマスクとして表わされます。

The type of the bitmask that represents a task is called a `Lane`. The type of the bitmask that represents a batch is called `Lanes`. (Note: these names are not final. I know using a plural is a bit confusing, but since the name appears all over the place, I wanted something that was short. But I'm open to suggestions.)

タスクを表すビットマスクの種類をLaneと呼びます。バッチを表すビットマスクの種類をLanesと呼びます。(注意：これらの名前は最終版ではないです。複数形は多少混乱を招くとわかっていますが、この名前があちこちに登場するので、短い名前にしたかったのです。でも、提案は受け付けています。)

In more concrete React terms, an update object scheduled by `setState` contains a `lane` field, a bitmask with a single bit enabled. This replaces the `update.expirationTime` field in the old model.

より具体的なReact用語では、`setState`によってスケジュールされた更新は`lane`フィールドを持ち、この`lane`は1つのビットが立っています。これは旧モデルの`update.expirationTime`フィールドを置き換えます

On the other hand, a fiber is not associated with only a single update, but potentially many. So it has a `lanes` field, a bitmask with zero or more bits enabled (`fiber.expirationTime` in the old model); and a `childLanes` field (`fiber.childExpirationTime`).

一方で、fiberは1つのアップデートだけでなく、潜在的には多くのアップデートに紐付いている可能性があります。そのためfiberは、0個以上のビットが立っているビットマスク`lanes`フィールドをもっています。（旧モデルの`fiber.expirationTime` )。そして `childLanes` fieldも持っています (旧モデルの `fiber.childExpirationTime`)。

Lanes is an opaque type. You can only perform direct bitmask manipulation inside the `ReactFiberLane` module. Elsewhere, you must import a helper function from that module. This is a trade off, but one that I think is ultimately worth it, since dealing with Lanes can be very subtle, and colocating all the logic will make it easier for us to tweak our heuristics without having to do a huge refactor (like this one) every time.

Lanesはopaque型[^1}です。ReactFiberLaneモジュール内でのみ、ビットマスクの直接操作を行うことができます。他の場所では、そのモジュールからヘルパー関数をインポートする必要があります。これはトレードオフですが、最終的には価値のあるものだと思います。というのも、Laneの扱いは非常にとらえがたく、すべてのロジックをコロケーションすることで、（今回のような）大規模なリファクタリングを毎回行うことなく、ヒューリスティックな調整を容易にすることができるからです。

**Commonly seen ExpiratTime fields, translated to Lanes**

- `renderExpirationtime` -> `renderLanes`
- `update.expirationTime` -> `update.lane`
- `fiber.expirationTime` -> `fiber.lanes`
- `fiber.childExpirationTime` -> `fiber.childLanes`
- `root.firstPendingTime` and `root.lastPendingTime` -> `fiber.pendingLanes`

https://github.com/facebook/react/pull/18796

https://qiita.com/omochimetaru/items/f13fe3e54fab01648ba4[^1]

# Fiber Principles: Contributing To Fiber

I just wanted to document a few unique design patterns that apply to Fiber, but not necessarily anything else. I'll start here.

- You may mutate the fiber that you're working on during `beginWork` and `completeWork` phases but you may not have any other global side-effects. If you need a global side-effect, that have to be moved to the `commitWork` phase.

- `beginWork`と`completeWork`フェーズで作業中のファイバーをmutateすることは可能ですが、グローバルな副作用があってはいけません。もしグローバルな副作用が必要なら、`commitWork`に移動させる必要があります。

- Fiber is a fixed data structure. It shares the same hidden class. Never add fields outside of construction in `ReactFiber`.

- Fiberは固定のデータ構造です。Fiberは同一の隠しクラスを共有しています。`ReactFiber`で構造の外にフィールドを追加しないでください。

- Nothing in the reconciler uses dynamic dispatch. I.e. we don't call a first class function, except for user code such as ref callbacks, functional components, render methods, etc. The rest is a static function available in a closure. I.e. use `myHelper(obj)` instead of `obj.myHelper()`. Any time we need to branch logic we use a switch statement over a `tag` which is a number that indicates which type of object we're dealing with and which branch to take (see pattern matching).

- リコンセラーでは、動的ディスパッチを使用しているものはありません。つまり、refコールバック、機能コンポーネント、レンダリングメソッドなどのユーザーコードを除いて、ファーストクラスの関数を呼び出さないのです。それ以外は、クロージャで利用できる静的な関数です。例えば、obj.myHelper()ではなく、myHelper(obj)を使います。論理を分岐させる必要があるときは、switch文とタグを使います。タグとは、どのタイプのオブジェクトを扱っているか、どの分岐を取るかを示す番号です（パターンマッチを参照）。

- Many modules are instantiated with a `HostConfig` object. It is a single constructor that gets called on initialization time. This should be inlinable by a compiler.

- 多くのモジュールはHostConfigオブジェクトでインスタンス化されます。これは、初期化時に呼ばれる単一のコンストラクタです。これは、コンパイラによってインライン化されるべきものです。

- Nothing in Fiber uses the normal JS stack. Meaning it does use the stack but it can be compiled into a flat function if needed. Calling other functions is fine - the only limitation is that they can't be recursive.

- Fiberには、通常のJSスタックを使用するものはありません。つまり、スタックを使用しますが、必要に応じてフラットな関数にコンパイルすることができます。他の関数を呼び出すことは問題ありませんが、唯一の制限は、再帰的であってはならないということです。

- If I can't use recursion, how do I traverse through the tree? Learn to use the singly linked list tree traversal algorithm. E.g. parent first, depth first:

- もし再帰が使えないなら、どうやってツリーをたどるのでしょうか？単結合リストのツリー探索アルゴリズムを使うことを覚えてください。例えば、parent first, depth first:

  ```javascript
  let root = fiber;
  let node = fiber;
  while (true) {
    // Do something with node
    if (node.child) {
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }
    while (!node.sibling) {
      if (!node.return || node.return === root) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
  ```

​		Why does it need to be this complicated?

- We can use the normal JS stack for this but any time we yield in a `requestIdleCallback` we would have to rebuild the stack when we continue. Since this only lasts for about 50ms when idle, we would spend some time unwinding and rebuilding the stack each time. It is not too bad. However, everything along the stack would have to be aware of how to "unwind" when we abort in the middle of the work flow.

- このために通常のJSスタックを使用することができますが、requestIdleCallbackで降伏するたびに、続行するときにスタックを再構築する必要があります。これはアイドル時には約50msしか持続しないので、毎回スタックを巻き戻したり再構築したりするのに時間がかかります。これはそれほど悪いことではありません。しかし、ワークフローの途中で中止した場合、スタック上のすべてのものが「巻き戻し」の方法を認識していなければなりません。

- It is plausible we could do this at the level of OCaml algebraic effects but we don't currently have all the features we need and we don't get the performance tradeoffs we want out of the box atm. This is a plausible future way forward though.

- OCamlの代数的効果のレベルでこれを実現することは可能ですが、現在のところ、必要な機能がすべて揃っているわけではありませんし、求めるパフォーマンスのトレードオフも得られません。しかし、これは将来的には有力な方法です。

- Most code lives outside of this recursion so it doesn't matter much for most cases.

- ほとんどのコードはこの再帰の外側にあるので、ほとんどのケースではあまり問題になりません。

- Most of what React does is in the space of what the normal stack does. E.g. memoization, error handling, etc. Using the normal stack too, just makes it more difficult to get those to interact.

- Reactが行うことのほとんどは、通常のスタックが行うことの範囲内にあります。例えば、メモ化、エラー処理などです。通常のスタックも使用すると、それらを相互に作用させることがより困難になります。

- Everything we put on the stack we generally have to put on the heap too because we memoize it. Maintaining the stack and the heap with the same data is theoretically less efficient.

- スタックに置くものはすべて、メモ化するので、一般的にはヒープにも置かなければなりません。スタックとヒープを同じデータで維持することは、理論的には効率が悪くなります。

- That said, all of these optimizations might be moot because JS stacks are much more efficient than JS heaps.

- とはいえ、JSのスタックはJSのヒープよりもはるかに効率的なので、これらの最適化はすべて無意味かもしれません。

- One thing that I wanted to try was to compile React components to do work directly on these data structures, just like normal programming languages compile to make mutations etc. to the stack. I think that's where the ideal implementation of React is.

- 試してみたかったのは、通常のプログラミング言語がスタックに変異などを加えるためにコンパイルするのと同じように、Reactコンポーネントをコンパイルして、これらのデータ構造に対して直接作業を行うことです。そこにReactの理想的な実装があるのではないかと思います。

  



  

Let's just try it and see how it goes. :D

cc [@spicyj](https://github.com/spicyj) [@gaearon](https://github.com/gaearon) [@acdlite](https://github.com/acdlite)



# @acdlite explains New Feature 

Time Slicing はノンブロッキングレンダリングを実現する機能。たとえば全体として重い計算を実行しているページで、遅延なくフォームをレンダリングできる

これを実現するのが、レンダリングの優先度付け（と打ち切り？）

Suspense は簡単にasyncデータを扱える仕組み

https://twitter.com/acdlite/status/1056612147432574976/photo/1





# One-shot Delimited Continuations with Effect Handlers



https://esdiscuss.org/topic/one-shot-delimited-continuations-with-effect-handlers

# The how and why on React’s usage of linked list in Fiber to walk the component’s tree

各コンポーネントごとに呼ばれる処理が違う

***\*All these activities are referred to as work inside Fiber\****. The type of work that needs to be done depends on the type of the React Element. For example, for a `Class Component` React needs to instantiate a class, while it doesn't do it for a `Functional Component`. If interested, [here](https://github.com/facebook/react/blob/340bfd9393e8173adca5380e6587e1ea1a23cefa/packages/shared/ReactWorkTags.js?source=post_page---------------------------#L29-L28) you can see all types of work targets in Fiber. These activities are exactly what Andrew talks about here:

多くの処理が一度に実行されると、アニメーションのフレーム落ちがしばしば発生する。

### Fiber Reconciler

The “fiber” reconciler is a new effort aiming to resolve the problems inherent in the stack reconciler and fix a few long-standing issues. It has been the default reconciler since React 16.

ブラウザがアイドルの際に呼び出される関数があればよく、**\*requestIdleCallback\*はその一つ。(実際には独自実装が使用されている）

しかし、React Reconcilerの既存実装ではrequestIdleCallbackは使用できない。なぜなら、call stackはスタックが空になるまで処理を続け、一部のコンポーネントだけを出力することができないから。

>  Its main goals are:
>
> - Ability to split interruptible work in chunks.
> - Ability to prioritize, rebase and reuse work in progress.
> - Ability to yield back and forth between parents and children to support layout in React.
> - Ability to return multiple elements from `render()`.
> - Better support for error boundaries.

https://reactjs.org/docs/codebase-overview.html?source=post_page---------------------------#fiber-reconciler

再帰的なスタックモデルの実装から非同期的な連結リストへ移行することで、レンダリングの中断と優先度付けを実現





# Under-the-hood-ReactJS

https://bogdan-lyashenko.github.io/Under-the-hood-ReactJS/

