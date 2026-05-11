/* Fake event stream that mimics YOLO v11 JSON packets +
   AG-UI agent events + telemetry deltas. */

// YOLO COCO-ish classes the rover encounters
const YOLO_CLASSES = [
  { name: 'chair',   cluster: 'furniture' },
  { name: 'laptop',  cluster: 'electronics' },
  { name: 'person',  cluster: 'people' },
  { name: 'bottle',  cluster: 'objects' },
  { name: 'monitor', cluster: 'electronics' },
  { name: 'cup',     cluster: 'objects' },
  { name: 'book',    cluster: 'objects' },
  { name: 'cable',   cluster: 'electronics' },
  { name: 'door',    cluster: 'spatial' },
  { name: 'plant',   cluster: 'spatial' },
  { name: 'keyboard',cluster: 'electronics' },
  { name: 'mouse',   cluster: 'electronics' },
];

const CLUSTER_COLORS = {
  furniture:   '#fbbf24',
  electronics: '#60a5fa',
  people:      '#f472b6',
  objects:     '#34d399',
  spatial:     '#a78bfa',
};

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Build a single YOLO v11 detection packet
function makeYoloPacket(t = Date.now()) {
  const cls = randItem(YOLO_CLASSES);
  const conf = 0.62 + Math.random() * 0.36;
  // bbox normalised [x, y, w, h] in 0..1
  const w = 0.08 + Math.random() * 0.32;
  const h = 0.10 + Math.random() * 0.42;
  const x = Math.random() * (1 - w);
  const y = Math.random() * (1 - h);
  return {
    schema: 'yolo.v11.detection/1',
    t,
    frame_id: Math.floor(t / 33),
    source: 'webcam_0',
    npu: 'rk3588.npu0',
    object: {
      class_id: YOLO_CLASSES.indexOf(cls),
      class: cls.name,
      cluster: cls.cluster,
      confidence: +conf.toFixed(3),
      bbox: { x: +x.toFixed(3), y: +y.toFixed(3), w: +w.toFixed(3), h: +h.toFixed(3) },
      // a few mask polygon points for v11 segmentation
      mask: Array.from({ length: 6 }, () => [
        +(x + Math.random() * w).toFixed(3),
        +(y + Math.random() * h).toFixed(3),
      ]),
    },
  };
}

// Predefined sample message script for the agent panel
const AGENT_SCRIPT = [
  {
    by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
    text: <>YOLO detected <strong>laptop</strong> at 91% confidence. Rendering A2UI action card:</>,
    a2: { class: 'laptop', confidence: 0.91, cluster: 'electronics' },
  },
  {
    by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
    text: <>YOLO detected <strong>person</strong> at 90% confidence. Rendering A2UI action card:</>,
    a2: { class: 'person', confidence: 0.90, cluster: 'people' },
  },
  {
    by: ['AGENT', 'AG-UI', 'gemini-2.0-flash'],
    text: <>YOLO detected <strong>laptop</strong> at 88% confidence. Rendering A2UI action card:</>,
    a2: { class: 'laptop', confidence: 0.88, cluster: 'electronics' },
  },
];

const RAG_SEED = [
  // Cluster 1: furniture
  { id: 'n1',  label: 'chair',    cluster: 'furniture', x: 0.20, y: 0.30, weight: 14, t: -380 },
  { id: 'n2',  label: 'desk',     cluster: 'furniture', x: 0.28, y: 0.42, weight: 9,  t: -360 },
  { id: 'n3',  label: 'shelf',    cluster: 'furniture', x: 0.14, y: 0.46, weight: 4,  t: -310 },
  // Cluster 2: electronics
  { id: 'n4',  label: 'laptop',   cluster: 'electronics', x: 0.62, y: 0.30, weight: 17, t: -340 },
  { id: 'n5',  label: 'monitor',  cluster: 'electronics', x: 0.74, y: 0.24, weight: 11, t: -250 },
  { id: 'n6',  label: 'keyboard', cluster: 'electronics', x: 0.69, y: 0.40, weight: 8,  t: -210 },
  { id: 'n7',  label: 'mouse',    cluster: 'electronics', x: 0.78, y: 0.38, weight: 5,  t: -180 },
  { id: 'n8',  label: 'cable',    cluster: 'electronics', x: 0.83, y: 0.30, weight: 3,  t: -120 },
  // Cluster 3: people
  { id: 'n9',  label: 'person',   cluster: 'people',  x: 0.46, y: 0.74, weight: 13, t: -90 },
  { id: 'n10', label: 'face',     cluster: 'people',  x: 0.40, y: 0.82, weight: 6,  t: -80 },
  // Cluster 4: spatial
  { id: 'n11', label: 'door',     cluster: 'spatial', x: 0.18, y: 0.78, weight: 6,  t: -60 },
  { id: 'n12', label: 'plant',    cluster: 'spatial', x: 0.30, y: 0.86, weight: 4,  t: -50 },
  { id: 'n13', label: 'window',   cluster: 'spatial', x: 0.10, y: 0.66, weight: 5,  t: -45 },
  // Cluster 5: objects
  { id: 'n14', label: 'cup',      cluster: 'objects', x: 0.56, y: 0.54, weight: 7,  t: -30 },
  { id: 'n15', label: 'bottle',   cluster: 'objects', x: 0.66, y: 0.62, weight: 5,  t: -20 },
  { id: 'n16', label: 'book',     cluster: 'objects', x: 0.50, y: 0.62, weight: 4,  t: -10 },
];

const RAG_EDGES = [
  ['n1','n2'], ['n2','n3'], ['n2','n4'],
  ['n4','n5'], ['n4','n6'], ['n5','n6'], ['n6','n7'], ['n7','n8'], ['n4','n8'],
  ['n9','n10'], ['n9','n4'],
  ['n11','n13'], ['n12','n13'], ['n11','n9'],
  ['n14','n2'], ['n15','n14'], ['n16','n14'], ['n16','n4'],
];

window.MockData = {
  YOLO_CLASSES,
  CLUSTER_COLORS,
  makeYoloPacket,
  AGENT_SCRIPT,
  RAG_SEED,
  RAG_EDGES,
};
