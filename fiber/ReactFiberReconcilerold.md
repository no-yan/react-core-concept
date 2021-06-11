# ReactFiberReconciler.old



https://github.com/facebook/react/tree/master/packages/react-reconciler



### `renderWithHooks`

`didScheduleRenderPhaseUpdateDuringThisPass`が`true`でレンダリング回数が上限に達していなければ、`children = Component(props, secondArg)`を計算し直す。

```typescript
export function renderWithHooks<Props, SecondArg>(
 current: Fiber | null,
 workInProgress: Fiber,
 Component: (p: Props, arg: SecondArg) => any,
 props: Props,
 secondArg: SecondArg,
 nextRenderLanes: Lanes,
): (children:any) {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;
    
  // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so memoizedState would be null during updates and mounts.
  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
   // currentかmemorizedStateがnullの場合Mount、ほかをUpdateのDISPATCHに。
}
```

`currentHook = null,  workInProgressHook = null,  workInProgress.updateQueue = null`は他の関数で変更されたものを初期化している。

ここでDispatcherを割り当てている。

```typescript
ReactCurrentDispatcher.current = __DEV__
    ? HooksDispatcherOnRerenderInDEV
	: HooksDispatcherOnRerender;
```

### updateContainer

updateにプロパティを追加して、enqueueUpdateでグローバルなqueueに追加する。

```javascript
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  if (__DEV__) {
    onScheduleRoot(container, element);
  }
  const current = container.current; // createFiberRootのuninitializedFiber
  const eventTime = requestEventTime();
  if (__DEV__) {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ('undefined' !== typeof jest) {
      warnIfUnmockedScheduler(current);
      warnIfNotScopedWithMatchingAct(current);
    }
  }
  const lane = requestUpdateLane(current);

  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  if (__DEV__) {
    if (
      ReactCurrentFiberIsRendering &&
      ReactCurrentFiberCurrent !== null &&
      !didWarnAboutNestedUpdates
    ) {
      didWarnAboutNestedUpdates = true;
      console.error(
        'Render methods should be a pure function of props and state; ' +
          'triggering nested component updates from render is not allowed. ' +
          'If necessary, trigger nested updates in componentDidUpdate.\n\n' +
          'Check the render method of %s.',
        getComponentNameFromFiber(ReactCurrentFiberCurrent) || 'Unknown',
      );
    }
  }

  const update = createUpdate(eventTime, lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    if (__DEV__) {
      if (typeof callback !== 'function') {
        console.error(
          'render(...): Expected the last optional `callback` argument to be a ' +
            'function. Instead received: %s.',
          callback,
        );
      }
    }
    update.callback = callback;
  }

  enqueueUpdate(current, update, lane);
  const root = scheduleUpdateOnFiber(current, lane, eventTime);
  if (root !== null) {
    entangleTransitions(root, current, lane);
  }

  return lane;
}
```



> #TODO: enqueueUpdate 

# ReactFiberBeginWork.old.js





# ReactFiberWorkLoop.old.js
このファイルはグローバル変数が多いので、結構頑張って読む必要がある。スケジューラーなのでしょうがないが。

ここでイベントの実行をみてる

### Execution Context

```javascript
const NoContext = /*                    */ 0b00000;
const BatchedContext = /*               */ 0b00001;
const EventContext = /*                 */ 0b00010;
const LegacyUnbatchedContext = /*       */ 0b00100;
const RenderContext = /*                */ 0b01000;
const CommitContext = /*                */ 0b10000;
```

### 使用法

bitをつかって、Contextをオンオフできる。

```javascript
const ExecutionContext = getExecutionContext();
if (ExecutionContext & BatchedContext) {
    console.log('BatchedContextのビットが立っています');
    doSomething();
    ExecutionContext |= BatchedContext;
} ;
if (ExecutionContext ^ BatchedContext) {
    console.log('BatchedContextのビットが立っていません');
    doSomething();
    ExecutionContext |= BatchedContext
}
ExecutionC
```

複数のbitを使うと、どのbitが立っているか確認できる。



ExecutionContext は NoContext = 0 で初期化されている。

```javascript
const {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
  ReactCurrentBatchConfig,
  IsSomeRendererActing,
} = ReactSharedInternals;

type ExecutionContext = number; // workerPhase -> ExecusionContext のissueを参照

export const NoContext = /*             */ 0b000000;
const BatchedContext = /*               */ 0b000001;
const EventContext = /*                 */ 0b000010;
const LegacyUnbatchedContext = /*       */ 0b000100;
const RenderContext = /*                */ 0b001000;
const CommitContext = /*                */ 0b010000;
export const RetryAfterError = /*       */ 0b100000;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5;
const RootIncomplete = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;
// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

type Mode =   NoMode | StrictLegacyMode | ProfileMode | ConcurrentMode
const RENDER_TIMEOUT_MS = 500 //これ以上になると？
```

Lanesでは ExecutionContext をビットフラグで管理することで、特定のビットフラグが立つかの確認を簡単にしている。



```typescript
function scheduleUpdateOnFiber(fiber:Fiber, lane:Lane, eventTime:number):FiberRoot|null;

```



Tag の定義。

lazyが下なので多分後ろがdefer?

```javascript
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
```

###  requestEventTime

時間を返す関数。Reactが最初に呼ばれたときの時間か、レンダー最初の時間か？

TODO: requestEventTime()の正確な挙動。RenderContext, CommitContextが立っていることは何を意味するのか。inside React とは？

```javascript
export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) { // Render/Commit Context が立っていない
    // We're inside React, so it's fine to read the actual time.
    return now();
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoTimestamp) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = now();
  return currentEventTime;
}
```



#### batchedUpdates

concurrent はバッチが立つため、常にNoContextにならない。

何もスケジュールがない（呼び出しの一番外側）ときflushする。

```javascript
export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  const prevExecutionContext = executionContext;
  executionContext |= BatchedContext; //batchedをたてる
  try {
    return fn(a); //updateContainer
  } finally {
    executionContext = prevExecutionContext; //contextを元にもどす
    // If there were legacy sync updates, flush them at the end of the outer
    // most batchedUpdates-like method.
    if (executionContext === NoContext) {
      resetRenderTimer();
      flushSyncCallbacksOnlyInLegacyMode();
    }
  }
}
```

#### flushSyncCallbackOnlyInLegacyMode

​	syncQueue にcallbackが入っているので、それを一つずつ処理していく。次のところがなにをしているかわからない。callback(true)を実行して、nullにならない限り実行し続ける。syncQueueに何が入るか見なければ。

```javascript
do {
          callback = callback(isSync);
        } while (callback !== null);
      }
```

```javascript
export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrancy.
    isFlushingSyncQueue = true;
    let i = 0;
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      // TODO: Is this necessary anymore? The only user code that runs in this
      // queue is in the render or commit phases.
      setCurrentUpdatePriority(DiscreteEventPriority);
      for (; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      syncQueue = null;
      includesLegacySyncCallbacks = false;
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      // Resume flushing in the next tick
      scheduleCallback(ImmediatePriority, flushSyncCallbacks);
      throw error;
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
  return null;
}
```

### workLoopSync()

もう時間切れなので、コミットフェーズに移行。workinProglessがなくなるまで、performUnitOfWorkを呼び出し続ける。

```javascript
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

