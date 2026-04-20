const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { FileText, NotebookPen, X, ExternalLink, Tag, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

// Build graph nodes + edges from files + notes
function buildGraph(files, notes) {
  const nodes = [];
  const edges = [];

  files.forEach((f) => {
    nodes.push({ id: `file-${f.id}`, label: f.name, type: 'file', tags: f.tags || [], data: f });
  });
  notes.forEach((n) => {
    nodes.push({ id: `note-${n.id}`, label: n.title || 'Untitled', type: 'note', tags: n.tags || [], data: n });
  });

  // Connect nodes that share tags
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const sharedTags = nodes[i].tags.filter((t) => nodes[j].tags.includes(t));
      if (sharedTags.length > 0) {
        edges.push({ source: i, target: j, sharedTags, strength: sharedTags.length });
      }
    }
  }

  // Also connect notes that mention each other's titles
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const alreadyLinked = edges.some((e) => (e.source === i && e.target === j) || (e.source === j && e.target === i));
      if (!alreadyLinked) {
        const ai = nodes[i].data;
        const aj = nodes[j].data;
        const contentA = ((ai.content || '') + (ai.extracted_text || '') + (ai.summary || '')).toLowerCase();
        const contentB = ((aj.content || '') + (aj.extracted_text || '') + (aj.summary || '')).toLowerCase();
        const labelA = nodes[i].label.toLowerCase();
        const labelB = nodes[j].label.toLowerCase();
        if ((labelA.length > 3 && contentB.includes(labelA)) || (labelB.length > 3 && contentA.includes(labelB))) {
          edges.push({ source: i, target: j, sharedTags: [], strength: 1, type: 'content' });
        }
      }
    }
  }

  return { nodes, edges };
}

export default function KnowledgeGraph() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  const { data: files = [] } = useQuery({ queryKey: ['files'], queryFn: () => db.entities.File.list('-created_date') });
  const { data: notes = [] } = useQuery({ queryKey: ['notes'], queryFn: () => db.entities.Note.list('-updated_date') });

  const initScene = useCallback((canvas, files, notes) => {
    const { nodes, edges } = buildGraph(files, notes);
    setStats({ nodes: nodes.length, edges: edges.length });
    if (nodes.length === 0) return;

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.z = Math.max(200, nodes.length * 12);

    // Initialize positions
    const positions = nodes.map((_, i) => ({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      z: (Math.random() - 0.5) * 100,
      vx: 0, vy: 0, vz: 0,
    }));

    // Node meshes
    const nodeMeshes = nodes.map((node, i) => {
      const isFile = node.type === 'file';
      const geo = isFile
        ? new THREE.BoxGeometry(8, 8, 8)
        : new THREE.SphereGeometry(5, 16, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: isFile ? 0xC97B3A : 0x4A7FA5,
        emissive: isFile ? 0x7A3A10 : 0x1A3F65,
        shininess: 80,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { index: i, node };
      scene.add(mesh);
      return mesh;
    });

    // Edge lines
    const edgeLines = edges.map((edge) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const mat = new THREE.LineBasicMaterial({
        color: edge.sharedTags.length > 0 ? 0xC97B3A : 0x557799,
        opacity: 0.35,
        transparent: true,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return line;
    });

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 100);
    scene.add(dirLight);

    // Force simulation
    let frame = 0;
    const simulate = () => {
      const k = 0.02;
      const repulse = 2000;
      const attract = 0.003;
      const damp = 0.85;

      // Repulsion
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dz = positions[i].z - positions[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1;
          const force = repulse / (dist * dist);
          positions[i].vx += (dx / dist) * force;
          positions[i].vy += (dy / dist) * force;
          positions[j].vx -= (dx / dist) * force;
          positions[j].vy -= (dy / dist) * force;
        }
      }

      // Attraction along edges
      edges.forEach(({ source, target, strength }) => {
        const dx = positions[target].x - positions[source].x;
        const dy = positions[target].y - positions[source].y;
        const dz = positions[target].z - positions[source].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1;
        const force = attract * dist * strength;
        positions[source].vx += dx * force;
        positions[source].vy += dy * force;
        positions[target].vx -= dx * force;
        positions[target].vy -= dy * force;
      });

      // Center gravity
      positions.forEach((p) => {
        p.vx -= p.x * 0.002;
        p.vy -= p.y * 0.002;
        p.vz -= p.z * 0.005;
        p.vx *= damp;
        p.vy *= damp;
        p.vz *= damp;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
      });
    };

    // Mouse
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (isDragging) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        scene.rotation.y += dx * 0.005;
        scene.rotation.x += dy * 0.005;
        lastMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseDown = (e) => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);
      if (hits.length > 0) {
        setSelected(hits[0].object.userData.node);
      } else {
        setSelected(null);
      }
    };
    const onWheel = (e) => {
      camera.position.z = Math.max(50, Math.min(800, camera.position.z + e.deltaY * 0.3));
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: true });

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (frame < 300) { simulate(); frame++; }

      nodeMeshes.forEach((mesh, i) => {
        mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
        mesh.rotation.y += 0.005;
      });

      edges.forEach(({ source, target }, i) => {
        const pos = edgeLines[i].geometry.attributes.position;
        pos.setXYZ(0, positions[source].x, positions[source].y, positions[source].z);
        pos.setXYZ(1, positions[target].x, positions[target].y, positions[target].z);
        pos.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    sceneRef.current = {
      cleanup: () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      },
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || (files.length === 0 && notes.length === 0)) return;
    if (sceneRef.current) sceneRef.current.cleanup();
    initScene(canvasRef.current, files, notes);
    return () => { if (sceneRef.current) sceneRef.current.cleanup(); };
  }, [files, notes, initScene]);

  const isFile = selected?.type === 'file';

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-10 py-6 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent mb-1">Knowledge Graph</p>
          <h1 className="font-serif text-3xl font-light">Your mind, mapped</h1>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#4A7FA5] inline-block" /> Notes
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#C97B3A] inline-block" /> Files
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-px bg-[#C97B3A] inline-block" /> Shared tags
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-px bg-[#557799] inline-block opacity-60" /> Content link
          </span>
          <span className="px-3 py-1 rounded-full bg-secondary text-xs">
            {stats.nodes} nodes · {stats.edges} connections
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 bg-gradient-to-br from-background via-background to-secondary/30">
        {files.length === 0 && notes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="font-serif text-2xl text-muted-foreground mb-2">Nothing to map yet.</p>
            <p className="text-sm text-muted-foreground mb-6">Upload files or write notes — ARI will connect them.</p>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="rounded-full"><Link to="/files">Upload files</Link></Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/notes/new">Write a note</Link></Button>
            </div>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-background/70 backdrop-blur px-4 py-1.5 rounded-full">
              Drag to rotate · Scroll to zoom · Click a node to inspect
            </p>
          </>
        )}

        {/* Selected node panel */}
        {selected && (
          <div className="absolute top-4 right-4 w-80 bg-card border border-border rounded-2xl shadow-xl p-5 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {isFile
                  ? <FileText className="w-4 h-4 text-[#C97B3A]" strokeWidth={1.5} />
                  : <NotebookPen className="w-4 h-4 text-[#4A7FA5]" strokeWidth={1.5} />}
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{selected.type}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-serif text-xl leading-tight mb-3">{selected.label}</h3>

            {selected.data.summary && (
              <p className="text-xs text-muted-foreground font-serif italic leading-relaxed mb-4">
                {selected.data.summary}
              </p>
            )}
            {selected.data.content && !selected.data.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                {selected.data.content}
              </p>
            )}

            {selected.tags?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <Button asChild size="sm" variant="outline" className="w-full rounded-full mt-1">
              {isFile
                ? <a href={selected.data.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open file</a>
                : <Link to={`/notes/${selected.data.id}`}><Link2 className="w-3.5 h-3.5 mr-1.5" />Open note</Link>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}