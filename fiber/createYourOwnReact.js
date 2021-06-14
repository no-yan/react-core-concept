// step0: review
// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "hello",
//   },
// };
// const container = document.getElementById("root");
// // どこに挿入するか選択
// const node = document.createElement(element.type);
// node["title"] = element.props.title;

// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;
// node.appendChild(text);
// container.appendChild(node);

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  const isProperty = (key) => key !== "children";

  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  element.props.children.forEach((child) => render(child, dom));
  container.appendChild(dom);
}

const Didact = {
  createElement,
  render,
};
//どうもJSXの変換がうまくいかないので、調べる。多分babelを導入する必要がある。codesandboxの例は動いているが、これはどういうコマンドで起動しているのか。
/** @jsx Didact.createElement */
// const element = (
//   <div>
//     <h1>hello world</h1>
//     <h2>good bye world</h2>
//   </div>
// );
const element = /*#__PURE__*/ Didact.createElement(
  "div",
  {
    id: "foo",
  },
  /*#__PURE__*/ Didact.createElement("a", null, "bar"),
  /*#__PURE__*/ Didact.createElement("b", null, "hoge")
);
const container = document.getElementById("root");
Didact.render(element, container);
