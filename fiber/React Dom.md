# React Dom

React Fiber
レンダーでどの関数が呼ばれているかの画像。
render( element,  container, callback? ): legacyRenderSubtreeIntoContainer( null,  element, container, false, callback);
	LRenderSubtreeIntoContainer( parentComponent, children, container, forceHydrate, callback? ): getPublicRootInstance(fiberRoot)
		LCreateRootFromDomContainer(container, forceHydrate): craeteLRoot(container, forceHydrate)
		 createLRoot(container, options): **new** ReactDOMLegacyRoot(container, options)
		 	ReactDomLRoot (container, options)  //  this._internalRoot = createRootImpl(container, LegacyRoot, options);
		 		createRootImpl(container, tag, options): createContainer(container, tag, ...[])
		 			createContainer(containerInfo, tag, ...[]): createFiberRoot(containerInfo, tag, ...[])
		 				createFiberRoot(containerInfo, tag, ...[]) => new FiberRootNode(containerInfo, tag, hydrate)
		 					FiberRootNode
		 					createHostRootFiber
		 						create Fiber
		 			listenToAllSupportedEvents
		 				anonymous
		 					listenToNativeEvenets
		 						addTrappedEventListener
		 							createEventListWithProperty
 		 							getEventProperty
 		 						addEventCaptureLitener
 		 							addEventListener
 		 						addEventBubbleListener
 		 							addEventListener



​		unbatchedUpdate // これ以降reconciler
​			anonymous
​				updateContainer(element, container, parentComponent, callback) => requestUpdateLane(current) // = 1
​					markRenderScheduled
​						markAndClear

​                    scheduleUpdateOnFiber(current, lane, eventTime) =>  FiberRoot | null
​						[* perform]SyncWorkOnRoot
​							renderRootSync
​								movePendingFiverToMemorized
​								prepareFreshStack
​								workLoopSync
​									performUnitOfWork
​										beginWork$1
​											beginWork
​												updateHost[* Root]
​													pushHostRootContext
​														pushHostContainer
​															getRootHostContext
​													processUpdateQueue
​													pushCacheProvider
​													reconcileChidlen
​													reconcileSingleElement
​													createFiberFromElement
​									beginWork$1
​										beginWork
​											updateHost[* Component]
​									completeCommitOfWork
​										completeWork
​											createInstance
​											validateDOMNesting
​											createElement
​										finalizeInitialChildren
​											setInitialProperties
​												validatePropertiesInDevelopment(多分validate系は__dev__なので以下書かない)
 										commitRootImpl
 											flushRenderPhase
 												commitBeforeMutationEffects					

​						

​		after this, react performs commit.

[https://gyazo.com/01ec23ce21e39d8ce50ce34605f5f337]



## fiber

Singly Linked List Tree Structureとあるが、連結リストなのに木構造をとるのおかしくない？

```json
export type Fiber = {|
  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.

  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.

  // Tag identifying the type of fiber.
  tag: WorkTag,

  // Unique identifier of this child.
  key: null | string,

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any,

  // The resolved function/class/ associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref:
    | null
    | (((handle: mixed) => void) & {_stringRef: ?string, ...})
    | RefObject,

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: mixed,

  // The state used to create the output
  memoizedState: any,

  // Dependencies (contexts, events) for this fiber, if it has any
  dependencies: Dependencies | null,

  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the mode of its
  // parent. Additional flags can be set at creation time, but after that the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  mode: TypeOfMode,

  // Effect
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null,

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  lanes: Lanes,
  childLanes: Lanes,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null,

  // Time spent rendering this Fiber and its descendants for the current update.
  // This tells us how well the tree makes use of sCU for memoization.
  // It is reset to 0 each time we render and only updated when we don't bailout.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualDuration?: number,

  // If the Fiber is currently active in the "render" phase,
  // This marks the time at which the work began.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualStartTime?: number,

  // Duration of the most recent render time for this Fiber.
  // This value is not updated when we bailout for memoization purposes.
  // This field is only set when the enableProfilerTimer flag is enabled.
  selfBaseDuration?: number,

  // Sum of base times for all descendants of this Fiber.
  // This value bubbles up during the "complete" phase.
  // This field is only set when the enableProfilerTimer flag is enabled.
  treeBaseDuration?: number,

  // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.
  // __DEV__ only

  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
  _debugNeedsRemount?: boolean,

  // Used to verify that the order of hooks does not change between renders.
  _debugHookTypes?: Array<HookType> | null,
|};
```

> ファイバーとそのサブツリーに関するプロパティを記述するビットフィールド。例えば、ConcurrentModeフラグは、サブツリーがデフォルトで非同期であるべきかどうかを示します。ファイバーが作成されると，その親のモードを継承します。作成時に追加のフラグを設定することもできますが，その後はファイバの寿命が尽きるまで，特に子ファイバが作成されるまでは値を変更しないようにしてください。

> The first thing React does is create the `fiber tree` for our application. Without this, it cannot handle any user updates or events. The tree is created by calling `legacyCreateRootFromDOMContainer`, which returns the following object:

https://dev.to/carlmungazi/a-journey-through-reactdom-render-302c ちょっと不正確っぽさを感じる

Fiberの型定義と說明

https://github.com/facebook/react/blob/d75105fa92cfc77f41bcd56bf9eb127a132e44cb/packages/react-reconciler/src/ReactInternalTypes.js#L60

## render

不適切な呼び出しを弾くだけ

```javascript
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function,
) {
  invariant(
    isValidContainer(container),
    'Target container is not a DOM element.',
  );
  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
      );
    }
  }
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback,
  );
}
```



## legacyRenderSubtreeIntoContainer

initial mount ?

​	root,  container._reactRootContainer に container を設定 (いわゆる#root)

```javascript
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>, // null(renderからの呼び出し時)
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean, //renderからの呼び出しはfalse
  callback: ?Function,
) {
  if (__DEV__) {
    topLevelUpdateWarnings(container);
    warnOnInvalidCallback(callback === undefined ? null : callback, 'render');
  }

  let root = container._reactRootContainer; 
  // _reactRootContainer ははじめundefined
  let fiberRoot: FiberRoot;
  if (!root) {
    // ルートが存在しないということはマウント（最初の呼び出し）とわかる
    // Initial mount
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
      // ここconsole.logしたい root, container._reactRootContainerは何が入っているか。　=> fiber
    );
    fiberRoot = root._internalRoot; //createRootImpl(container, ConcurrentRoot=1, options)のこと　ReactDOMRootで挿入される。
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
```

## createFiberRoot

root.current = uninitializedFiber

```javascript
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  concurrentUpdatesByDefaultOverride: null | boolean,
): FiberRoot {
  // TODO: FiberRootNode
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  // Cyclic(循環的な、周期的な) construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(
    tag,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
  );
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  if (enableCache) {
    const initialCache = new Map();
    root.pooledCache = initialCache;
    const initialState = {
      element: null,
      cache: initialCache,
    };
    uninitializedFiber.memoizedState = initialState;
  } else {
    const initialState = {
      element: null,
    };
    uninitializedFiber.memoizedState = initialState;
  }

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
```







~1 = -2

x  & ~1  は　x // 2 * 2 と等価

　ReactCurrentOwnerってなに？

https://github.com/facebook/react/pull/4174を見る限りでは、Reactのエラーメッセージに使われている。今どの関数が処理されているかという情報？



containerは多分ルートエレメントのこと。一番親の部分

