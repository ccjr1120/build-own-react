function createDom(fiber) {
  const dom =
    fiber.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);
  const isProperty = (key) => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });
  return dom;
}


Rodrigo Pombo
November 13, 2019

Build your own React
We are going to rewrite React from scratch. Step by step. Following the architecture from the real React code but without all the optimizations and non-essential features.

If you’ve read any of my previous “build your own React” posts, the difference is that this post is based on React 16.8, so we can now use hooks and drop all the code related to classes.

You can find the history with the old blog posts and the code on the Didact repo. There’s also a talk covering the same content. But this is a self-contained post.

Starting from scratch, these are all the things we’ll add to our version of React one by one:

Step I: The createElement Function
Step II: The render Function
Step III: Concurrent Mode
Step IV: Fibers
Step V: Render and Commit Phases
Step VI: Reconciliation
Step VII: Function Components
Step VIII: Hooks
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
​
const container = document.getElementById("root")
​
const node = document.createElement(element.type)
node["title"] = element.props.title
​
const text = document.createTextNode("")
text["nodeValue"] = element.props.children
​
node.appendChild(text)
container.appendChild(node)
Step Zero: Review
But first let’s review some basic concepts. You can skip this step if you already have a good idea of how React, JSX and DOM elements work.

We’ll use this React app, just three lines of code. The first one defines a React element. The next one gets a node from the DOM. The last one renders the React element into the container.

Let’s remove all the React specific code and replace it with vanilla JavaScript.

On the first line we have the element, defined with JSX. It isn’t even valid JavaScript, so in order to replace it with vanilla JS, first we need to replace it with valid JS.

JSX is transformed to JS by build tools like Babel. The transformation is usually simple: replace the code inside the tags with a call to createElement, passing the tag name, the props and the children as parameters.

React.createElement creates an object from its arguments. Besides some validations, that’s all it does. So we can safely replace the function call with its output.

And this is what an element is, an object with two properties: type and props (well, it has more, but we only care about these two).

The type is a string that specifies the type of the DOM node we want to create, it’s the tagName you pass to document.createElement when you want to create an HTML element. It can also be a function, but we’ll leave that for Step VII.

props is another object, it has all the keys and values from the JSX attributes. It also has a special property: children.

children in this case is a string, but it’s usually an array with more elements. That’s why elements are also trees.

The other piece of React code we need to replace is the call to ReactDOM.render.

render is where React changes the DOM, so let’s do the updates ourselves.

First we create a node* using the element type, in this case h1.

Then we assign all the element props to that node. Here it’s just the title.

* To avoid confusion, I’ll use “element” to refer to React elements and “node” for DOM elements.

Then we create the nodes for the children. We only have a string as a child so we create a text node.

Using textNode instead of setting innerText will allow us to treat all elements in the same way later. Note also how we set the nodeValue like we did it with the h1 title, it’s almost as if the string had props: {nodeValue: "hello"}.

Finally, we append the textNode to the h1 and the h1 to the container.

And now we have the same app as before, but without using React.

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}
​
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
​
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
​
const Didact = {
  createElement,
  render,
}
​
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)
Step I: The createElement Function
Let’s start again with another app. This time we’ll replace React code with our own version of React.

We’ll start by writing our own createElement.

Let’s transform the JSX to JS so we can see the createElement calls.

As we saw in the previous step, an element is an object with type and props. The only thing that our function needs to do is create that object.

We use the spread operator for the props and the rest parameter syntax for the children, this way the children prop will always be an array.

For example, createElement("div") returns:

{
  "type": "div",
  "props": { "children": [] }
}
createElement("div", null, a) returns:

{
  "type": "div",
  "props": { "children": [a] }
}
and createElement("div", null, a, b) returns:

{
  "type": "div",
  "props": { "children": [a, b] }
}
The children array could also contain primitive values like strings or numbers. So we’ll wrap everything that isn’t an object inside its own element and create a special type for them: TEXT_ELEMENT.

React doesn’t wrap primitive values or create empty arrays when there aren’t children, but we do it because it will simplify our code, and for our library we prefer simple code than performant code.

We are still using React’s createElement.

In order to replace it, let’s give a name to our library. We need a name that sounds like React but also hints its didactic purpose.

We’ll call it Didact.

But we still want to use JSX here. How do we tell babel to use Didact’s createElement instead of React’s?

If we have a comment like this one, when babel transpiles the JSX it will use the function we define.

Step II: The render Function
Next, we need to write our version of the ReactDOM.render function.

For now, we only care about adding stuff to the DOM. We’ll handle updating and deleting later.

We start by creating the DOM node using the element type, and then append the new node to the container.

We recursively do the same for each child.

We also need to handle text elements, if the element type is TEXT_ELEMENT we create a text node instead of a regular node.

The last thing we need to do here is assign the element props to the node.

And that’s it. We now have a library that can render JSX to the DOM.

Give it a try on codesandbox.

Step III: Concurrent Mode
But… before we start adding more code we need a refactor.

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}
​
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
​
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
​
let nextUnitOfWork = null
​
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}
​
requestIdleCallback(workLoop)
​
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
​
const Didact = {
  createElement,
  render,
}
​
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)
There’s a problem with this recursive call.

Once we start rendering, we won’t stop until we have rendered the complete element tree. If the element tree is big, it may block the main thread for too long. And if the browser needs to do high priority stuff like handling user input or keeping an animation smooth, it will have to wait until the render finishes.

So we are going to break the work into small units, and after we finish each unit we’ll let the browser interrupt the rendering if there’s anything else that needs to be done.

We use requestIdleCallback to make a loop. You can think of requestIdleCallback as a setTimeout, but instead of us telling it when to run, the browser will run the callback when the main thread is idle.

React doesn’t use requestIdleCallback anymore. Now it uses the scheduler package. But for this use case it’s conceptually the same.

requestIdleCallback also gives us a deadline parameter. We can use it to check how much time we have until the browser needs to take control again.

As of November 2019, Concurrent Mode isn’t stable in React yet. The stable version of the loop looks more like this:

while (nextUnitOfWork) {    
  nextUnitOfWork = performUnitOfWork(   
    nextUnitOfWork  
  ) 
}
To start using the loop we’ll need to set the first unit of work, and then write a performUnitOfWork function that not only performs the work but also returns the next unit of work.

Step IV: Fibers
To organize the units of work we’ll need a data structure: a fiber tree.

We’ll have one fiber for each element and each fiber will be a unit of work.

Let me show you with an example.

Fiber Tree 3Fiber Tree 4
Suppose we want to render an element tree like this one:

Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
)
In the render we’ll create the root fiber and set it as the nextUnitOfWork. The rest of the work will happen on the performUnitOfWork function, there we will do three things for each fiber:

add the element to the DOM
create the fibers for the element’s children
select the next unit of work
One of the goals of this data structure is to make it easy to find the next unit of work. That’s why each fiber has a link to its first child, its next sibling and its parent.

When we finish performing work on a fiber, if it has a child that fiber will be the next unit of work.

From our example, when we finish working on the div fiber the next unit of work will be the h1 fiber.

If the fiber doesn’t have a child, we use the sibling as the next unit of work.

For example, the p fiber doesn’t have a child so we move to the a fiber after finishing it.

And if the fiber doesn’t have a child nor a sibling we go to the “uncle”: the sibling of the parent. Like a and h2 fibers from the example.

Also, if the parent doesn’t have a sibling, we keep going up through the parents until we find one with a sibling or until we reach the root. If we have reached the root, it means we have finished performing all the work for this render.

Now let’s put it into code.

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}
​
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
​
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)
​
  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })
​
  return dom
}

function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

let nextUnitOfWork = null;
let wipRoot = null;
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

export default render;
