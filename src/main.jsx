import React from 'react';
import ReactDOM from 'react-dom';
import Didact from './Didact';

const element = Didact.createElement(
  'div',
  { id: 'foo' },
  Didact.createElement('a', null, 'bar'),
  Didact.createElement('b')
);

const container = document.getElementById('root');

Didact.render(element, container);
