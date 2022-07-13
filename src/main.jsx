import React from 'react';
import ReactDOM from 'react-dom/client';

const createElement

const Didact = {
  createElement,
};

const element = React.createElement(
  'div',
  { id: 'foo' },
  React.createElement('a', null, 'bar'),
  React.createElement('b')
);

const container = document.getElementById('root');

ReactDOM.createRoot(container as HTMLElement).render(element);
