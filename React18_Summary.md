# TODO

TODO：next.js confまで集中する

TODO１:Concurrentの説明を完成させる

- [ ] 内部挙動の写真をとり、記事に貼り付ける
- [x] デバウンスを使用している記事を見つける
- [x] demoでスムーズに入力できることを確認してもらう

TODO2: SSR Suspenseを完成させる

- [x] Suspenseの記事を読む
- [x] 内部のコンポーネントをサスペンドすることがどういったメリットをもつか説明する
- [ ] Server Componentとの関連について調べる

TODO3: startTransition, useDefferedValueを完成させる

- [x] startTransitionは既存の解説があることを示す
- [x] timeoutMSがなくなった理由を示す
- [x] 関連して、fallbackを表示する方法があるか調べる（最近danがツイートしていた）
- [x] useDefferedValueは基本的にかわっていないことを示す
- [ ] 解説が投稿されていないのでわからない
- [ ] 実際の使用例
- [ ] - アニメーション
  - デバウンス
  - たとえば検索欄のサジェスト

TODO4: これ以外に書く主要なアップデートがないか確認する

TODO5: 今後のアップデート方針について記載する

- useOpaqueIdentifierなどを調べる

TODO6: 

- [ ] 





この記事はアーリーアダプタのためのもので、APIなどが変更される可能性は大いにあります。この記事の用語がわからないと感じたら、[Glossary + Explain Like I'm Five](https://github.com/reactwg/react-18/discussions/46)を眺めるといい気がします。





# React 18とはなにか、fiberの観点から理解する

React 18では目新しい機能が多く導入されます。たとえば追加されるものにはConcurrent ModeやstartTransition、SSRの改善や新しいSuspenseなどがあります。

私はこれらの機能について解説した記事をいくつも読みましたが、いまいちピンと来ませんでした。

- これらが凄いのは伝わるけれど、どうして必要なのか？
- なぜこれらの機能が一度に追加されたのか？
- React Core Team はどこを目指しているのか？

おそらく、多くの方がこれと同じ疑問を抱いていると思います。これらの機能追加の基本コンセプトは何でしょうか。SSRのSuspense, Concurrent API、etc... なぜ同時に追加されたのでしょうか。時間をかけて調べるうちに、これらの機能がひとつの軸をもって說明できることがわかりました。

今回の記事は、この議論をするまえに、Reactの新機能をまとめるものです。

あと、Suspense for data fetchingはリリースされないみたいだが、Suspenseはどこまで使っていいのかという疑問にも答えられるはず。別にlazyのコードスプリッティングのためだけではない。

# React 18の新機能

[Jser.info](https://jser.info/2021/06/15/react-18-a-deno-1.11docker-images-plotly.js-2.0/)や[この動画](https://www.youtube.com/watch?v=bpVRWrrfM1M&t=44s)がよくまとまっている。もっと詳しく知りたいなら、[koba04さんの記事](https://blog.koba04.com/post/2021/06/16/effects-in-react-v18)から関心ある部分のリンクをたどるとよい。



Reactの新機能のうち、大きなものは次の1つです。後に說明するけれど、Concurrent Modeはコストのかかる計算をしていてもアプリケーションをインタラクティブに保つReact実装。

## 新機能

- Concurrent Modeのデフォルト化

## APIレベルでの変更

- [SSRにSuspenseが導入](https://github.com/reactwg/react-18/discussions/37)
- startTransition, useDeferredValue, SuspenseList の追加
- エントリーポイントが[renderからReactDOM.createRoot()](https://github.com/reactwg/react-18/discussions/6)に変更
- SSRにpipeToNodeWritableが追加

## 内部機能の変更

- [auto batchingの対象拡大](https://github.com/reactwg/react-18/discussions/21)
- [Suspenseの挙動変更](https://github.com/reactwg/react-18/discussions/7)　[変更](https://github.com/reactwg/react-18/discussions/47)

## その他

- [ReactDOM.render(), hydrate()が非推奨化](https://github.com/facebook/react/pull/21652)

https://github.com/reactwg/react-18/discussions/4

## Upcoming Update

- [Server Component](https://github.com/reactjs/rfcs/blob/2b3ab544f46f74b9035d7768c143dc2efbacedb6/text/0000-server-components.md#why-not-use-asyncawait)
- React Cache
- React-Fetch
- new API: [useSubscription, useMutableSource, ](https://gist.github.com/bvaughn/054b82781bec875345bd85a5b1344698)[useOpaqueIdentifier](https://github.com/facebook/react/issues/18565)

# Concurrent とはなにか

Concurrentとは、Reactがレンダリング作業を中断し、更新の優先順位に応じて画面を更新することで、アプリケーションをインタラクティブに保つ新機能のこと。後でブログを書くので、それを参照してほしい。

Concurrent機能の特徴は２つある。React18からはレンダリングが中断可能になり、ユーザーが入力をする際に受け付けないことが減る。更新の優先順位をつけることができるので、優先度の低いコンポーネントの処理を後回しにできる。Concurrent renderingとは、この「レンダリングを中断可能」「処理の優先度付け」という２つの機能の実現により、CPU heavy でも応答性に優れたアプリケーション開発をしやすくする機能である。

とりあえず使えればいい人には「startTransitionやdeferredValueを使うと、Concurrentモードの機能が使える」という、通りのいい方便で説明してあげるのが良い。



（要確認：レンダリングが中断できるようになっているか？startTransitionなどが入った時限定？すべてはurgent）

## 使用用途

ユーザーとしてのConcurrent機能の用途は、アニメーションやフォームなどのフレーム落ちの回避がある。たとえば、これまではフォームへの入力がカクつく際にデバウンスなどで更新を遅らせる必要があった([リクルートでの例](https://recruit-tech.co.jp/blog/2020/02/14/performance-and-refactoring/))。これらの解決手法のアプローチはレスポンシブ性を低くすることで負荷を減らすことであり、想定環境にCPU性能の低いものを含めるほど、よりレスポンシブでないアプリを提供しなければならなかった。

startTransitionはこれらの手法と違い、ユーザーごとに適切なレスポンシブ性を提供できる。この関数は「暇なときに更新しといてね」関数なので、CPU性能が高い環境では変更を即座に反映させ、CPU性能の低い環境では更新を遅らせて快適に入力してもらうことができる。これまでの手法はCPU性能に関わらず一律に反映を遅らせることで解決していたが、Concurrent APIを使うと環境ごとに適切な負荷軽減策をとってくれる。[デモ](https://react-beta-seven.vercel.app/)

このように、React の Concurrent APIを使うことでよりインタラクティブなアプリを簡単につくることができる。Reactは120fpsでもフレーム落ちしない](https://github.com/reactwg/react-18/discussions/27)ため、高負荷なアニメーション(react-three-fiberなど)の他にも、フレーム落ちが酔いに直結するVRなどの領域でReactを採用できる要因になるのではないか。

## デモ

（下のデモを触って効果を体感してみてください）

https://react-beta-seven.vercel.app/ 

CPUのスロットリングをいじれば、Concurrentが更新を柔軟にスケジューリングすることも確認できる。

https://twitter.com/dan_abramov/status/1403507868779913222

## Concurrent 機能のデフォルト化

Concurrent 機能はReact18ではデフォルトで導入される。つまり、これらの機能を使うためになにか設定する必要はない。

「デフォルト化」は「startTransitionやdeferredValueを使うと、Concurrentモードの機能が使える」という方便と対立していてうまく理解できない人もいるだろう。[解説](https://github.com/reactwg/react-18/discussions/45#discussioncomment-849895)見てピンとこなければ、そういうものだと受け入れるのでいいと思う。

# [エントリーポイントの変更](https://github.com/reactwg/react-18/discussions/5)

React18 からデフォルトのクライアントサイドエントリーポイントが ReactDOM.render ではなく ReactDOM.createRoot になった。createRoot を使用してはじめて、React18 に追加された機能を使うことができる。

React17まで

```javascript
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```

React18から

```javascript
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App/>);
```

SSRの場合、createRootにオプションを追加する必要がある。

```javascript
const root = ReactDOM.createRoot(rootElement, { hydrate: true });
```

レンダーコールバックは削除され、かわりにrequestIdleCallback、setTimeout、ref callbackを使うことをすすめられている。

## [ReactDOM.render, hydrateの非推奨化](https://github.com/facebook/react/pull/21652)

これにあわせて `ReactDOM.render` , `ReactDOM.hydrate`が非推奨になる。これは今までのSuspenseが特定の条件で引き起こすバグがあり、このバグが修正不可能なため。



# startTransition, useDefferedValue

startTransitionについては[Richyの解説](https://github.com/noyanyan/react-core-concept/blob/main/startTransition.md)を翻訳したので、参考にしてほしい。



# [SSR：Suspense導入による変化](https://github.com/reactwg/react-18/discussions/37)

SSRでSuspenseが導入され、React.lazyでコード分割されたチャンク単位でHTMLを配信することが可能になる。また、HTMLにJavaScriptをくっつける（ハイドレーション）動作もチャンク単位で行えるようになる。

これらの変更により、ユーザーの**待ち時間**を短縮することができる。

> React 18は、SSRに2つの主要な機能を提供します。
>
> - **HTMLのストリーミングを**使用すると、HTMLの配信を好きなだけ早く開始でき、追加のコンテンツのHTMLを、適切な場所に配置する`<script>`タグと一緒にストリーミングできます。
> - **セレクティブハイドレーションを**使用すると、残りのHTMLコードとJavaScriptコードが完全にダウンロードされる前に、できるだけ早くアプリの**ハイドレーション**を開始できます。また、ユーザーが操作しているパーツのハイドレーションを優先し、瞬時のハイドレーションのような錯覚を作り出します。
>
> これらの機能は、ReactのSSRに関する3つの長年の問題を解決します。
>
> - **HTMLを送信する前に、すべてのデータがサーバーにロードされるのを待つ必要がなくなりました。**代わりに、アプリのシェルを表示するのに十分な量になったらすぐにHTMLの送信を開始し、準備ができたら残りのHTMLをストリーミングします。
> - **すべてのJavaScriptが読み込まれるのを待ってハイドレーティングを開始する必要がなくなりました。**代わりに、サーバーレンダリングと一緒にコード分割を使用できます。サーバーのHTMLは保持され、関連するコードが読み込まれるとReactがそれをハイドレイトします。
> - **すべてのコンポーネントがハイドレートしてページとの対話を開始するのを待つ必要がなくなりました。**代わりに、Selective Hydrationを使用して、ユーザーが操作しているコンポーネントに優先順位を付け、それらを早期にハイドレートすることができます。

https://github.com/reactwg/react-18/discussions/37

SSRはいくつかの段階を経て動いている。

- サーバーで、app全てのデータを取得する
- 次にサーバーで、app全てをHTMLにレンダーして、レスポンスとして送信する
- 次にクライアントで、app全てのJavaScriptコードを読み込む
- 次にクライアントで、JavaScriptのロジックを、サーバーが生成したapp全体のHTMLと接続する(これが"hydration")

これらは前の段階が完全に終わらなければ次の段階に進めないタイプの作業である（コンポーネントの情報が揃わなければそのレンダリングはできないため）。

React17までのSSRの問題は、アプリケーション単位で各段階の作業を進めるため、遅いコンポーネントが作業をブロックして次の工程に進めない問題が起こることだった。たとえばSidebarコンポーネントとMainContentコンポーネントがあるとき、Sidebarのデータ取得が先に完了していてもMainContentで完了するまで待ってレンダリング作業を始める仕組みだった。

React18はHTMLとJSを分割できるようにすることで、「できた部分から配信し、優先順位が高いものからハイドレーションする」ことを可能に、遅いコンポーネント律速問題を解決する。

[demo](https://codesandbox.io/s/github/facebook/react/tree/master/fixtures/ssr2?file=/server/render.js:590-1736)



# Auto Batching

## バッチ処理とはなにか

React で

```javascript
import React {useState} from 'react';

const App = () => {
    const [count, setCount] = useState(0);
    setCount(count+1);
    setCount(count+1);
}
```

いくつかの状態の変更をいちいち処理せず、一度に処理すること。これによりレンダリングの回数を抑えられる。

「レストランであなたがウエイターに一品注文しても、すぐキッチンに行かず、次の注文を聞こうと待っているようなもの」という説明。

stateが変化するとレンダリングが発生するため、状態の更新をいちいち行うと多数のレンダリングが発生する。状態の更新をためて、一括で更新することにより無駄なレンダリングを抑えることができる。

これまでバッチ処理の対象はイベントハンドラの内部に限られており、

# Suspenseの挙動変更





# startTransitionはデフォルトのアニメーション追加を予定している

The reason we're comfortable naming the whole thing `startTransition` is we anticipate a future where *all* transitions are animated, not just some. Like that's how iOS works; for many interactions, the developer doesn't have to do anything extra to animate things on and off the screen. Which is why native apps tend to feel more pleasant than web ones. You get nice transitions out of the box.

https://github.com/reactwg/react-18/discussions/41



# startTransition と deferredValueの使いわけ？

ほとんど役割がかぶっていないか？

useTransitionとuseDefferedValueはやっていることが同じように見える。TimeOutが設定できるかだけ？

```javascript
function useTransition(): [boolean, (() => void) => void] {
  // useTransition() composes multiple hooks internally.
  // Advance the current hook index the same number of times
  // so that subsequent hooks have the right memoized state.
  nextHook(); // State
  nextHook(); // Callback
  hookLog.push({
    primitive: 'Transition',
    stackError: new Error(),
    value: undefined,
  });
  return [false, callback => {}];
}

function useDeferredValue<T>(value: T): T {
  // useDeferredValue() composes multiple hooks internally.
  // Advance the current hook index the same number of times
  // so that subsequent hooks have the right memoized state.
  nextHook(); // State
  nextHook(); // Effect
  hookLog.push({
    primitive: 'DeferredValue',
    stackError: new Error(),
    value,
  });
  return value;
}
```

```javascript
export function startTransition(scope: () => void) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
```

https://github.com/facebook/react/blob/1a3f1afbd3cf815d4e55628cd7d84ef20171bab8/packages/react/src/ReactStartTransition.js#L12-L20

FacebookでstartTransitionを使ったところ、たいてい{timeoutms:3000}のオンパレードだったと聞いた。そこまで意味がないと判断されたのか

# Upcoming Update

- React 18.0: Fixes to existing Suspense behavior quirks
- React 18.0: New Suspense features (like SSR support)
- Later (likely during React 18.x timeline): Suspense for Data Fetching

- [React I/O libraries like `react-fetch`](https://codesandbox.io/s/sad-banach-tcnim), which is a lightweight and easiest way to fetch data with Suspense.
- [Built-in Suspense](https://github.com/reactwg/react-18/discussions/25) which will likely be the primary recommended way for third-party data fetching libraries to integrate with Suspense. (For example, `react-fetch` uses it internally.)
- [Server Components](https://reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html), which will be the recommended way to fetch data with Suspense in a way that scales great and integrates with React Fetch as well as third-party libraries.

https://github.com/reactwg/react-18/discussions/47#discussioncomment-847004

https://github.com/reactwg/react-18/discussions/49

SSRとCSRで動作が共通になるように、なるべくuniversalなしくみを作ろうとしている。クラサバのコード共通化がテーマと理解して、カジュアルにサーバー側のコードを書けることに主眼があると理解している。	

### React Cache

[demo1](https://codesandbox.io/s/sad-banach-tcnim), [demo2](https://codesandbox.io/s/laughing-almeida-v3gk5?file=/src/App.js)

Just the UIという言葉はもう無いが、コンポーネントを`<Cache>`で囲むのを受け入れるのは、少しためらう。大域的な関心のないクエリに使うには、おそらく便利だろう。

> A good rule of thumb is that if it's a type of data that might be preserved when you hit the browser's refresh button, then it can be put into the cache.
>
> If the state is lost when you refresh, then it's probably UI state that belongs in a state hook.

https://github.com/reactwg/react-18/discussions/25#discussioncomment-800154

# Pitfalls and surprises in data fetching

https://github.com/reactwg/react-18/discussions/35

おそらくcacheの導入のモチベーションはconcurrent mode のmerge動作や複数のブランチという動作が、「正しい値」を保証できなくなるという問題。

# Suspenseのアンチパターン

Suspenseを使うと状態に応じて画面を振り分けられるが、fallbackのコンポーネントを深い木にすることはアンチパターンだと思う。Suspenseを使う場合、Suspenseで囲われたコンポーネントとfallbackの計算コストが両方とも大きい場合、両方をレンダリングすることでパフォーマンス上悪い結果がでる。

たとえば実務上、`auth = fetch(auth)`として、認証情報があればユーザーページ、そうでなければ普通の画面を出したいことがあると思う。この２つの画面の特徴は、どちらも少なくない計算コストが必要ということだ。これをSuspenseで行うのはあまり良くないのではないかと考えている。

先にも述べたようにSuspenseのfallbackとauthはどちらも呼び出されるため、`{auth ?  <User>: <NonUser> }`と比べて計算コストがかかることがある。Suspenseを使うとコストがかかる原因は、ユーザーページを閲覧中いつでもfallbackが表示できるようにfallback画面もstate更新に反応して計算されるからだ。`<p>now loading</p>`程度なら問題はないが、重いfallbackをSuspenseに入れることは避けた方が良いだろう。

Reactの実装コードを読んだり計測してみなければわからないので、実践上はSuspenseを使ってパフォーマンスを計測して判断するべきだと思う。パフォーマンスに影響がでるとわかった場合、fallbackは再帰的な呼び出しの深さがn以下のコンポーネントに限るなどとすれば良いのではないか。

なお、fallbackでない方は、レンダリングできないと判断されたタイミングで計算をやめるのでそこまでクリティカルでないはず。

(ここらへんはReactの実装次第。fallbackの優先度がオフスクリーンになっているなら、そこまでクリティカルにはならないだろう。実装をみる機会があれば更新する。)

# Questions about specifics of Concurrent scheduling

https://github.com/reactwg/react-18/discussions/27



# [なぜタイムスライシングがオプトインか](https://github.com/facebook/react/pull/21072)

> However, time-slicing can cause issues with existing code that was not written with yielding in mind. For example, by yielding to other work, we allow for the possibility that external sources of information read during render are updated. This can cause tearing - where part of the UI displays an old value and another part shows a new value. This isn't a React specific bug - it's the logical consequence of concurrency.
>
> We've introduced warnings and dev-behavior to StrictMode to help users catch these types of issues, however there is still a large part of the community that is not ready for the new behavior by default. If we were to keep time-slicing on by default for all updates, then most users would need to convert their entire app to support concurrency all at once before upgrading to the next major version of React.

https://github.com/facebook/react/pull/21072



# 最近devtoolsの開発に力を入れているよう

ほしい機能などあれば積極的に言ってみるのがよいかも

# React18のメリットをどう生かしていくのか

React18は120fpsでもフレーム落ちしない処理が可能なので、アニメーションやVRの分野でConcurrent機能を積極的に活かせる。

SSRまわりは今日のNext.js confを見て判断しよう。

https://html5experts.jp/shumpei-shiraishi/23265/

# Internal stories

https://twitter.com/rickhanlonii/status/1402771549808214016

https://twitter.com/dan_abramov/status/1402927593406582787