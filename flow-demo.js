/**
 * flow-demo.js
 *
 * Interactive React Flow demo for the Rules4J landing page.
 * Renders a payment-screening pipeline using custom node components.
 *
 * This is a plain ES module (no bundler, no JSX). All React elements
 * are created via React.createElement (aliased as `h`).
 *
 * Dependencies are resolved through the importmap defined in index.html.
 */

import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';

const h = React.createElement;

/* ------------------------------------------------------------------
   1. StartNodeComponent
   ------------------------------------------------------------------ */
function StartNodeComponent() {
  return h('div', { className: 'demo-start-node' },
    h('span', { className: 'demo-start-label' }, 'Start'),
    h(Handle, { type: 'source', position: Position.Right, id: 'source' })
  );
}

/* ------------------------------------------------------------------
   2. RuleNodeComponent
   ------------------------------------------------------------------ */
function RuleNodeComponent({ data }) {
  return h('div', { className: 'demo-rule-node' },
    // Header
    h('div', { className: 'demo-rule-header' }, data.name),

    // Body: 2-column grid with condition & action cards
    h('div', { className: 'demo-rule-body' },
      // Condition card
      h('div', { className: 'demo-rule-card' },
        h('span', { className: 'demo-rule-card-icon' }, '\uD83C\uDFAF'),
        h('span', { className: 'demo-rule-card-label' }, 'Condition'),
        h('span', { className: 'demo-rule-card-value' }, 'Dynamic')
      ),
      // Action card
      h('div', { className: 'demo-rule-card' },
        h('span', { className: 'demo-rule-card-icon' }, '\u26A1'),
        h('span', { className: 'demo-rule-card-label' }, 'Action'),
        h('span', { className: 'demo-rule-card-value' }, 'Dynamic')
      )
    ),

    // Footer: tag badges
    h('div', { className: 'demo-rule-footer' },
      data.tags.map(function (tag) {
        return h('span', {
          key: tag,
          className: 'demo-tag demo-tag-' + tag.toLowerCase(),
        }, tag);
      })
    ),

    // Handles
    h(Handle, { type: 'target', position: Position.Left, id: 'target' }),
    h(Handle, { type: 'source', position: Position.Right, id: 'source' })
  );
}

/* ------------------------------------------------------------------
   3. Node types registry
   ------------------------------------------------------------------ */
const nodeTypes = {
  startNode: StartNodeComponent,
  ruleNode: RuleNodeComponent,
};

/* ------------------------------------------------------------------
   4. Initial nodes (payment-screening flow)
   ------------------------------------------------------------------ */
const initialNodes = [
  { id: 'start', type: 'startNode', position: { x: 50, y: 185 }, data: {} },
  { id: 'velocity', type: 'ruleNode', position: { x: 280, y: 20 }, data: { name: 'velocity', tags: ['Dynamic', 'Concurrent'] } },
  { id: 'geo', type: 'ruleNode', position: { x: 280, y: 180 }, data: { name: 'geo', tags: ['Dynamic', 'Concurrent'] } },
  { id: 'merchant', type: 'ruleNode', position: { x: 280, y: 340 }, data: { name: 'merchant', tags: ['Dynamic', 'Concurrent'] } },
  { id: 'score', type: 'ruleNode', position: { x: 600, y: 180 }, data: { name: 'score', tags: ['Dynamic'] } },
  { id: 'decision', type: 'ruleNode', position: { x: 900, y: 180 }, data: { name: 'decision', tags: ['Dynamic'] } },
];

/* ------------------------------------------------------------------
   5. Initial edges
   ------------------------------------------------------------------ */
const initialEdges = [
  { id: 'e-start-velocity', source: 'start', target: 'velocity', animated: true },
  { id: 'e-start-geo', source: 'start', target: 'geo', animated: true },
  { id: 'e-start-merchant', source: 'start', target: 'merchant', animated: true },
  { id: 'e-velocity-score', source: 'velocity', target: 'score', animated: true },
  { id: 'e-geo-score', source: 'geo', target: 'score', animated: true },
  { id: 'e-merchant-score', source: 'merchant', target: 'score', animated: true },
  { id: 'e-score-decision', source: 'score', target: 'decision', animated: true },
];

/* ------------------------------------------------------------------
   6. FlowDemo component
   ------------------------------------------------------------------ */
function FlowDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return h('div', { style: { width: '100%', height: '100%' } },
    h(ReactFlow, {
      nodes: nodes,
      edges: edges,
      onNodesChange: onNodesChange,
      nodeTypes: nodeTypes,
      fitView: true,
      fitViewOptions: { padding: 0.2, maxZoom: 1 },
      nodesConnectable: false,
      elementsSelectable: false,
      deleteKeyCode: null,
      proOptions: { hideAttribution: true },
    },
      h(Background, {
        variant: BackgroundVariant.Dots,
        gap: 16,
        size: 1,
      }),
      h(Controls, {
        showInteractive: false,
      })
    )
  );
}

/* ------------------------------------------------------------------
   7. Initialization
   ------------------------------------------------------------------ */
export function initFlowDemo() {
  const container = document.getElementById('flowDemoRoot');
  if (!container) return;
  const root = createRoot(container);
  root.render(h(FlowDemo));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlowDemo);
} else {
  initFlowDemo();
}
