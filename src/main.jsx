/**
 * Step I: The createElement Function
 * Step II: The render Function
 * Step III: Concurrent Mode
 * Step IV: Fibers
 * Step V: Render and Commit Phases
 * Step VI: Reconciliation
 * Step VII: Function Components
 * Step VIII: Hooks
 */

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
