/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import ReactFlow, { addEdge, Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// Notification Component
const Notification = ({ message, type = "success" }) => (
 <div
  className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
   type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
  }`}>
  {message}
 </div>
);

// Node Components
const BaseNode = ({ title, icon: Icon, children }) => (
 <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] border-none">
  <div className="flex items-center justify-between mb-4">
   <div className="flex items-center gap-2">
    {Icon && <Icon className="w-5 h-5" />}
    <h3 className="font-medium">{title}</h3>
   </div>
   <div className="w-2 h-2 rounded-full bg-green-500" />
  </div>
  {children}
 </div>
);

const InputNode = ({ data }) => (
 <BaseNode title="INPUT" className="no-border">
  <p className="text-sm text-gray-500 mb-2">
   Write the input question you want to ask
  </p>
  <div>
   <label className="text-sm font-medium mb-1 block">Input</label>
   <textarea
    className="w-full p-3 rounded-lg text-sm"
    placeholder="What is the definition of science?"
    value={data.query || ""}
    onChange={(e) => data.onChange?.(data.id, "query", e.target.value)}
    rows={3}
   />
  </div>
 </BaseNode>
);

const LLMNode = ({ data }) => (
 <BaseNode title="LLM ENGINE">
  <div className="space-y-4">
   <div>
    <label className="text-sm font-medium mb-1 block">Model Name</label>
    <select
     className="w-full p-3 border rounded-lg text-sm"
     value={data.model || "gpt-3.5"}
     onChange={(e) => data.onChange?.(data.id, "model", e.target.value)}>
     <option value="gpt-3.5">gpt-3.5</option>
     <option value="gpt-4">gpt-4</option>
    </select>
   </div>
   <div>
    <label className="text-sm font-medium mb-1 block">OpenAI API Base</label>
    <input
     type="text"
     className="w-full p-3 border rounded-lg text-sm"
     placeholder="https://api.openai.com/v1"
     value={data.apiBase || ""}
     onChange={(e) => data.onChange?.(data.id, "apiBase", e.target.value)}
    />
   </div>
   <div>
    <label className="text-sm font-medium mb-1 block">OpenAI Key</label>
    <input
     type="password"
     className="w-full p-3 border rounded-lg text-sm"
     placeholder="Enter your OpenAI API key"
     value={data.apiKey || ""}
     onChange={(e) => data.onChange?.(data.id, "apiKey", e.target.value)}
    />
   </div>
   <div>
    <label className="text-sm font-medium mb-1 block">Max Tokens</label>
    <input
     type="number"
     className="w-full p-3 border rounded-lg text-sm"
     placeholder="2000"
     value={data.maxTokens || 2000}
     onChange={(e) => data.onChange?.(data.id, "maxTokens", e.target.value)}
    />
   </div>
   <div>
    <label className="text-sm font-medium mb-1 block">Temperature</label>
    <input
     type="number"
     className="w-full p-3 border rounded-lg text-sm"
     placeholder="0.5"
     step="0.1"
     min="0"
     max="1"
     value={data.temperature || 0.5}
     onChange={(e) => data.onChange?.(data.id, "temperature", e.target.value)}
    />
   </div>
  </div>
 </BaseNode>
);

const OutputNode = ({ data }) => (
 <BaseNode title="OUTPUT">
  <div>
   <label className="text-sm font-medium mb-1 block">Output Response</label>
   <div className="w-full p-3 border rounded-lg text-sm min-h-[120px] bg-gray-50">
    {data.output || "Output will appear here..."}
   </div>
  </div>
 </BaseNode>
);

const DraggableItem = ({ type, label, onDragStart }) => (
 <div
  draggable
  onDragStart={(e) => onDragStart(e, type)}
  className="flex items-center gap-2 p-3 rounded-lg cursor-move hover:bg-gray-50">
  <span className="text-gray-600">{label}</span>
 </div>
);

const nodeTypes = {
 input: InputNode,
 llm: LLMNode,
 output: OutputNode,
};

const WorkflowBuilder = () => {
 const [nodes, setNodes] = useState([]);
 const [edges, setEdges] = useState([]);
 const [notification, setNotification] = useState(null);

 const showNotification = (message, type = "success") => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const onConnect = useCallback(
  (params) => {
   const sourceNode = nodes.find((n) => n.id === params.source);
   const targetNode = nodes.find((n) => n.id === params.target);

   if (sourceNode?.type === "input" && targetNode?.type !== "llm") {
    showNotification("Input nodes can only connect to LLM nodes", "error");
    return;
   }
   if (sourceNode?.type === "llm" && targetNode?.type !== "output") {
    showNotification("LLM nodes can only connect to Output nodes", "error");
    return;
   }

   setEdges((eds) => addEdge(params, eds));
  },
  [nodes]
 );

 const onDragStart = (event, type) => {
  event.dataTransfer.setData("application/reactflow", type);
  event.dataTransfer.effectAllowed = "move";
 };

 const onDragOver = useCallback((event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
 }, []);

 const onDrop = useCallback(
  (event) => {
   event.preventDefault();

   const type = event.dataTransfer.getData("application/reactflow");
   if (!type) return;

   const position = {
    x: event.clientX - 100,
    y: event.clientY - 50,
   };

   const newNode = {
    id: `${type}-${nodes.length + 1}`,
    type,
    position,
    data: { onChange: handleNodeDataChange },
   };

   setNodes((nds) => nds.concat(newNode));
  },
  [nodes]
 );

 const handleNodeDataChange = useCallback((nodeId, field, value) => {
  setNodes((nds) =>
   nds.map((node) =>
    node.id === nodeId
     ? {
        ...node,
        data: { ...node.data, [field]: value, onChange: node.data.onChange },
       }
     : node
   )
  );
 }, []);

 const handleRun = () => {
  showNotification("Flow ran successfully");
 };

 const handleDeploy = () => {
  showNotification("Your workflow is ready to be deployed");
 };

 return (
  <div className="flex h-screen">
   <div className="bg-white w-64 p-4 border-r h-full">
    <h2 className="font-medium mb-4">Components</h2>
    <p className="text-sm text-gray-500 mb-4">Drag and Drop</p>
    <div className="space-y-2">
     <DraggableItem type="input" label="Input" onDragStart={onDragStart} />
     <DraggableItem type="llm" label="LLM Engine" onDragStart={onDragStart} />
     <DraggableItem type="output" label="Output" onDragStart={onDragStart} />
    </div>
   </div>

   <div className="flex-1 flex flex-col">
    <div className="h-16 border-b flex items-center justify-end px-4 bg-white">
     <div className="flex gap-2">
      <button
       onClick={handleDeploy}
       className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
       Deploy
      </button>
      <button
       onClick={handleRun}
       className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
       Run
      </button>
     </div>
    </div>

    <div className="flex-1 relative">
     <ReactFlow
      nodes={nodes}
      edges={edges}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}>
      <Background />
      <Controls />
     </ReactFlow>
    </div>
   </div>

   {notification && (
    <Notification message={notification.message} type={notification.type} />
   )}
  </div>
 );
};

export default WorkflowBuilder;
