import React from 'react';
import ReactDOM from 'react-dom';
/** @jsxRuntime classic */
import Didact from './Didact';

/** @jsx Didact.createElement */
const element = (
  <div>
    <h1>
      h1
      <p>H1>p</p>
      <a>H1>a</a>
    </h1>
    <h2>h2</h2>
  </div>
);

const container = document.getElementById('root');
Didact.render(element, container);
