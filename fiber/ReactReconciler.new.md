# ReactReconciler.new



Laneが優先度をどこで確認しているか確認したい。推測では複数の子ノードのうちいくつかのノードだけsyncだったときにsyncだけを行えるよう、比較する関数があるに違いない。



# ReactEventPriorities.new.js

https://github.com/facebook/react/pull/21082で優先度の計算がLanePriorityからEventPriorityに変更された

acdliteの言う限りでは、EventPriorityはlaneそのものなので、変換する手間が省けるとのこと。

つまり、この変更で優先度自体はLaneを参照するほかなくなる。

最下層で、一番優先度の高いlaneを返す関数**lanesToEventPriority**を定義している。

```javascript
export const DiscreteEventPriority: EventPriority = SyncLane;
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
export const DefaultEventPriority: EventPriority = DefaultLane;
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoLane;
//このcurrentUpdatePriorityを取り回す

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}
```



# **scheduleCallback**

**Scheduler_scheduleCallback**を投げているだけ

var IMMEDIATE_PRIORITY_TIMEOUT = -1;

*// Eventually times out*

var USER_BLOCKING_PRIORITY_TIMEOUT = 250;

var NORMAL_PRIORITY_TIMEOUT = 5000;

var LOW_PRIORITY_TIMEOUT = 10000;

# requestUpdateLane

基本的にLaneはこいつが決めているみたい。

startTransitionは専用のlaneをもち、lane数が限界まできたら使い回す

普通のものは**getCurrentUpdatePriority**でグローバル変数currentUpdatePriorityの値を使う

↑がNoLaneだった場合は、**getCurrentEventPriority**()で取得する

getCurrentEventPriorityはShimで、reconciler/src/ReactFiberHostConfigには何もないが、React-DOMなどに存在する

```javascript
export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    return (SyncLane: Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // This is a render phase update. These are not officially supported. The
    // old behavior is to give this the same "thread" (lanes) as
    // whatever is currently rendering. So if you call `setState` on a component
    // that happens later in the same render, it will flush. Ideally, we want to
    // remove the special case and treat them as if they came from an
    // interleaved event. Regardless, this pattern is not officially supported.
    // This behavior is only a fallback. The flag only exists until we can roll
    // out the setState warning, since existing code might accidentally rely on
    // the current behavior.
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  const isTransition = requestCurrentTransition() !== NoTransition;
  if (isTransition) {
    // The algorithm for assigning an update to a lane should be stable for all
    // updates at the same priority within the same event. To do this, the
    // inputs to the algorithm must be the same.
    //
    // The trick we use is to cache the first of each of these inputs within an
    // event. Then reset the cached values once we can be sure the event is
    // over. Our heuristic for that is whenever we enter a concurrent work loop.
    if (currentEventTransitionLane === NoLane) {
      // All transitions within the same event are assigned the same lane.
      currentEventTransitionLane = claimNextTransitionLane();
    }
    return currentEventTransitionLane;
  }

  // Updates originating inside certain React methods, like flushSync, have
  // their priority set by tracking it with a context variable.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  const updateLane: Lane = (getCurrentUpdatePriority(): any);
  if (updateLane !== NoLane) {
    return updateLane;
  }

  // This update originated outside React. Ask the host environment for an
  // appropriate priority, based on the type of event.
  //
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  const eventLane: Lane = (getCurrentEventPriority(): any);
  return eventLane;
}
```

# **enqueueUpdate**

謎。なにやってるの？**Interleaved**という概念も不明
＝＞　interelaved updateはレンダリング中に追加された更新。典型的には、concurrent下でのユーザー入力イベント。
多分渡されたupdate引数に対して update.nextを追加している
