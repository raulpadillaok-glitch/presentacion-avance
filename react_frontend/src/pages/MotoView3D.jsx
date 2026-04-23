import React, { useRef, useState } from 'react';
import { Box as BoxIcon, Zap, Settings2, Sliders, LayoutGrid } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, MeshWobbleMaterial } from '@react-three/drei';

// --- SUBKOMPONENTES 3D (PIEZAS AISLADAS) ---

// 1. EL MOTOR (V-TWIN STYLISED)
function EngineBlock(props) {
  const engineRef = useRef();
  
  // Ligera vibración para el motor
  useFrame((state) => {
    if (engineRef.current && props.isStandalone) {
      engineRef.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.01;
    }
  });

  return (
    <group ref={engineRef} {...props}>
      {/* Carter Principal */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1, 0.6, 0.7]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.4} />
      </mesh>
      
      {/* V-Cilindro Frontal */}
      <group position={[0.3, 0.2, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
        {/* Aletas refrigerantes */}
        {[-0.2, 0, 0.2].map((y, i) => (
          <mesh key={`f-${i}`} position={[0, y, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </group>
      
      {/* V-Cilindro Trasero */}
      <group position={[-0.3, 0.2, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
        {[-0.2, 0, 0.2].map((y, i) => (
           <mesh key={`r-${i}`} position={[0, y, 0]}>
             <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
             <meshStandardMaterial color="#333" />
           </mesh>
        ))}
      </group>

      {/* Energía de Fusión Neon (Core) */}
      <mesh position={[0, 0.1, 0.4]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <MeshWobbleMaterial factor={0.5} speed={2} color="#10b981" emissive="#10b981" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

// 2. SISTEMA DE RUEDA FRONTAL
function WheelSystem(props) {
  return (
    <group {...props}>
       {/* Neumático */}
       <mesh rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[0.8, 0.8, 0.3, 64]} />
         <meshStandardMaterial color="#0f0f0f" roughness={1} metalness={0.1} />
       </mesh>
       {/* Aro Central */}
       <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.31, 64]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
       </mesh>
       {/* Cinta Neon Interior */}
       <mesh rotation={[Math.PI / 2, 0, 0]}>
         <torusGeometry args={[0.55, 0.04, 16, 64]} />
         <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} />
       </mesh>
       {/* Disco de Freno */}
       <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 32]} />
          <meshStandardMaterial color="#eee" metalness={1} roughness={0.2} />
       </mesh>
       <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 32]} />
          <meshStandardMaterial color="#eee" metalness={1} roughness={0.2} />
       </mesh>
       {/* Ejes de suspensión (Horquilla) */}
       {props.showForks && (
         <>
           <mesh position={[0, 1, 0.3]} rotation={[0, 0, -0.3]}>
             <cylinderGeometry args={[0.06, 0.06, 2, 16]} />
             <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
           </mesh>
           <mesh position={[0, 1, -0.3]} rotation={[0, 0, -0.3]}>
             <cylinderGeometry args={[0.06, 0.06, 2, 16]} />
             <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
           </mesh>
         </>
       )}
    </group>
  );
}

// 3. CHASIS (Tanque, Asiento, Estructura)
function Chassis(props) {
  return (
    <group {...props}>
       {/* Bastidor Principal */}
       <mesh position={[0, 0, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[2.5, 0.2, 0.6]} />
          <meshStandardMaterial color="#222" metalness={0.8} />
       </mesh>
       
       {/* Tanque de Combustible Estilizado */}
       <mesh position={[0.6, 0.35, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[1.2, 0.6, 0.8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
       </mesh>
       {/* Linea Neon en el Tanque */}
       <mesh position={[0.6, 0.35, 0.41]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[1.2, 0.05, 0.02]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
       </mesh>

       {/* Asiento Curvo */}
       <mesh position={[-0.5, 0.1, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[1, 0.15, 0.6]} />
          <meshStandardMaterial color="#050505" roughness={1} />
       </mesh>
       {/* Carenado Trasero (Cola) */}
       <mesh position={[-1.2, 0.1, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.6, 0.2, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
       </mesh>
       {/* Faro Trasero */}
       <mesh position={[-1.5, 0.15, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.05, 0.1, 0.3]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={4} />
       </mesh>
       
       {/* Manubrios */}
       <mesh position={[1.2, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 16]} rotation={[Math.PI/2, 0, 0]} />
          <meshStandardMaterial color="#111" metalness={0.8} />
       </mesh>
       {/* Faro Frontal Principal */}
       <mesh position={[1.4, 0.3, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 32]} rotation={[0, 0, Math.PI/2]} />
          <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={3} />
       </mesh>
    </group>
  );
}

// 4. MOTO COMPLETA (ENSAMBLAJE DE TODAS LAS PIEZAS)
function FullMotorcycle(props) {
  const bikeRef = useRef();

  useFrame((state) => {
    if (bikeRef.current && props.isStandalone) {
      bikeRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.01 + 0.5;
    }
  });

  return (
    <group ref={bikeRef} {...props}>
       <EngineBlock position={[0, -0.2, 0]} isStandalone={false} />
       <Chassis position={[0, 0.8, 0]} />
       {/* Rueda Trasera */}
       <WheelSystem position={[-1.6, -0.2, 0]} showForks={false} />
       {/* Rueda Delantera con Horquilla conectando al volante */}
       <WheelSystem position={[1.8, -0.2, 0]} showForks={true} />
       
       {/* Tubo de Escape */}
       <group position={[-1.2, -0.5, 0.4]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
             <cylinderGeometry args={[0.08, 0.12, 1.5, 16]} />
             <meshStandardMaterial color="#333" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
             <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
             <meshStandardMaterial color="#111" metalness={0.9} />
          </mesh>
       </group>
    </group>
  );
}

// --- CONSTRUCTOR DE RENDERIZACIÓN POR CARACTERÍSTICA ---

export default function MotoView3D() {
  const [activePart, setActivePart] = useState('full');

  const navItems = [
    { id: 'full', title: 'Moto Completa', desc: 'Vehículo ensamblado' },
    { id: 'chassis', title: 'Chasis Central', desc: 'Estructura Aerodinámica' },
    { id: 'engine', title: 'Bloque V-Twin', desc: 'Motor de Combustión' },
    { id: 'wheel', title: 'Eje y Rueda', desc: 'Suspensión Frontal' },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <header className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 800 }}>
            <BoxIcon size={32} color="#10b981" /> Visor del Despiece Interactivo Radial
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Prototipo Generativo Nativo: Selecciona y aísla piezas específicas del vehículo para su diagnóstico minucioso.</p>
        </div>
      </header>

      {/* CARRUSEL DE NAVEGACIÓN DE PIEZAS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePart(item.id)}
            style={{
              background: activePart === item.id ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(168, 85, 247, 0.2))' : 'var(--bg-secondary)',
              border: `1px solid ${activePart === item.id ? '#10b981' : 'var(--border-color)'}`,
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minWidth: '220px',
              transition: 'all 0.3s ease',
              boxShadow: activePart === item.id ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: activePart === item.id ? '#10b981' : 'var(--text-main)', fontWeight: 'bold', marginBottom: '0.3rem' }}>
              {item.id === 'full' ? <LayoutGrid size={18}/> : item.id === 'chassis' ? <BoxIcon size={18}/> : item.id === 'engine' ? <Zap size={18}/> : <Settings2 size={18}/>}
              {item.title}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', flexGrow: 1 }}>
        
        {/* Visor Interactivo R3F Gigante */}
        <div style={{ background: 'linear-gradient(to bottom, #111, #000)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', height: '650px', position: 'relative' }}>
           
           <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, display: 'flex', gap: '1rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px', fontSize: '0.8rem', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                Modo: aislando "{activePart.toUpperCase()}"
              </span>
           </div>

           <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 10, color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <Sliders size={16} color="#a855f7" /> 
              Click + Arrastrar para Rotación 360° | Scroll para Acercar a los Mecanismos
           </div>

           {/* Canvas de React Three Fiber */}
           <Canvas shadows camera={{ position: [4, 3, 5], fov: 45 }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" castShadow />
              <pointLight position={[-10, 5, 5]} intensity={1.5} color="#a855f7" />
              <pointLight position={[0, -5, -5]} intensity={1.5} color="#10b981" />
              <Environment preset="night" />

              <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
                 {activePart === 'full' && <FullMotorcycle scale={0.9} isStandalone={true} />}
                 {activePart === 'engine' && <EngineBlock scale={1.8} position={[0, 0, 0]} isStandalone={true} />}
                 {activePart === 'wheel' && <WheelSystem scale={1.2} position={[0, 0, 0]} showForks={true} />}
                 {activePart === 'chassis' && <Chassis scale={1.5} position={[0, 0, 0]} />}
              </Float>

              <ContactShadows resolution={1024} scale={20} blur={2.5} opacity={0.6} far={10} color="#000000" position={[0, -1.8, 0]} />
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.15} enableDamping dampingFactor={0.05} autoRotate={true} autoRotateSpeed={0.5} />
           </Canvas>
        </div>

      </div>
    </div>
  );
}
