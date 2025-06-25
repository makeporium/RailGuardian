import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Train, ArrowRight, Loader2, QrCode, ShieldCheck, AreaChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, useInView, animate } from 'framer-motion';
import * as THREE from 'three';

// --- STABLE FOUNDATION 3D COMPONENTS (FROM YOUR WORKING CODE) ---

function Particles({ count = 2000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      p[i3] = (Math.random() - 0.5) * 30; p[i3 + 1] = (Math.random() - 0.5) * 20; p[i3 + 2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, [count]);
  useFrame((state) => {
    if(!pointsRef.current) return;
    const { mouse, clock } = state;
    const a = clock.getElapsedTime() * 0.1;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3; const x = positions[i3]; const y = positions[i3 + 1];
      pointsRef.current.geometry.attributes.position.array[i3 + 1] = y + Math.sin(a + x) * 0.5;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = mouse.x * 0.1;
    pointsRef.current.rotation.x = -mouse.y * 0.1;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.05} color="#5a67d8" sizeAttenuation transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function MovingTrain() {
  const trainRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, -2, 10), new THREE.Vector3(-5, 2, -10), new THREE.Vector3(10, 0, -8),
    new THREE.Vector3(8, -3, 5), new THREE.Vector3(0, 1, 12),
  ], true), []);
  useFrame((state) => {
    if(!trainRef.current) return;
    const t = (state.clock.getElapsedTime() * 0.05) % 1;
    const pos = curve.getPointAt(t); const lookAtPos = curve.getPointAt((t + 0.01) % 1);
    trainRef.current.position.copy(pos); trainRef.current.lookAt(lookAtPos);
  });
  return (
    <group ref={trainRef}>
      <mesh><boxGeometry args={[0.5, 0.5, 1.5]} /><meshStandardMaterial emissive="#e53e3e" emissiveIntensity={3} toneMapped={false} /><pointLight color="#e53e3e" distance={5} intensity={10} /></mesh>
      <mesh position-z={-2}><boxGeometry args={[0.4, 0.4, 1]} /><meshStandardMaterial color="#4a5568" /></mesh>
      <mesh position-z={-4}><boxGeometry args={[0.4, 0.4, 1]} /><meshStandardMaterial color="#4a5568" /></mesh>
    </group>
  );
}

function FloatingQRCode({ size = 10 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cubes = useMemo(() => {
    const temp = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (Math.random() > 0.3) temp.push({ id: temp.length, x, y, offset: Math.random() * 5 });
    return temp;
  }, [size]);
  useFrame((state) => {
    if(!ref.current) return;
    const t = state.clock.getElapsedTime();
    cubes.forEach(c => {
      const wave = Math.sin(t * 0.5 + c.offset + c.x * 0.5);
      dummy.position.set((c.x - size / 2) * 0.4, (c.y - size / 2) * 0.4, wave * 0.3);
      dummy.updateMatrix(); ref.current!.setMatrixAt(c.id, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.rotation.y = t * 0.1; ref.current.rotation.x = t * 0.05;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cubes.length]} position={[6, 0, -5]}>
      <boxGeometry args={[0.3, 0.3, 0.1]} /><meshStandardMaterial color="#d53f8c" emissive="#d53f8c" emissiveIntensity={1} toneMapped={false}/>
    </instancedMesh>
  );
}


// --- NEW ANIMATED STORY-TELLING UI COMPONENTS ---

const FeatureCard = ({ icon: Icon, title, description, color, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 text-center"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: '5deg' }}
        className={`inline-block p-4 rounded-xl mb-4 bg-slate-800 border border-slate-700`}
        style={{ color }}
      >
        <Icon size={32} />
      </motion.div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </motion.div>
  );
};

const AnimatedCounter = ({ to }: { to: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, amount: 1.0 });

    useEffect(() => {
        if (isInView && ref.current) {
            animate(0, to, {
                duration: 2,
                onUpdate: (latest) => {
                    ref.current!.textContent = Math.round(latest).toLocaleString();
                }
            })
        }
    }, [isInView, to]);

    return <span ref={ref}>0</span>;
}

const DashboardMockup = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [log, setLog] = useState("[LOG]: Train #A42 Cleaned - Bay 4");

  const logs = useMemo(() => [
    "[LOG]: Train #A42 Cleaned - Bay 4",
    "[ALERT]: Cleaning overdue at Central Station",
    "[LOG]: Supervisor approved task #8912",
    "[LOG]: Train #C19 departed Terminal A",
    "[LOG]: Maintenance task #5501 started",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLog(logs[Math.floor(Math.random() * logs.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [logs]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7 }}
      className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-8 aspect-video relative overflow-hidden shadow-2xl shadow-violet-500/10"
    >
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute w-full h-1/2 bottom-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        {/* Animated Counters */}
        <div className="absolute top-4 right-4 bg-slate-950/50 p-3 rounded-lg text-right backdrop-blur-sm">
            <p className="text-3xl font-bold text-white"><AnimatedCounter to={1492} /></p>
            <p className="text-sm text-slate-400">Tasks Completed Today</p>
        </div>
        {/* Live Feed Component */}
        <div className="absolute bottom-4 left-4 bg-slate-950/50 p-3 rounded-lg backdrop-blur-sm max-w-[calc(100%-150px)]">
            <p className="text-xs md:text-sm font-mono text-green-400 truncate animate-pulse">{log}</p>
        </div>
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---
const Index = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [uiVisible, setUiVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (profile) {
      const rolePath = { admin: '/dashboard/admin', supervisor: '/dashboard/supervisor', laborer: '/dashboard/worker' }[profile.role] || '/dashboard';
      navigate(rolePath, { replace: true });
    } else {
        const timer = setTimeout(() => setUiVisible(true), 500);
        return () => clearTimeout(timer);
    }
  }, [profile, loading, navigate]);

  if (loading || profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      <style>{`.bg-grid-pattern { background-image: radial-gradient(circle, rgba(139, 92, 246, 0.1) 1px, transparent 1px); background-size: 20px 20px; }`}</style>
      
      {/* 3D Canvas in the background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={5} castShadow />
          <Particles />
          <MovingTrain />
          <FloatingQRCode />
        </Canvas>
      </div>
      
      {/* UI on top of the canvas */}
      <div className="relative z-10 flex flex-col">
        <nav className="fixed top-0 w-full bg-slate-950/30 backdrop-blur-md border-b border-slate-800 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center"> <Train className="w-5 h-5 text-white" /> </div>
                <span className="font-bold text-xl">Railway Clean</span>
              </div>
              <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white px-5 py-2 rounded-lg font-medium group">
                Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </nav>
        
        <main className="w-full">
            {/* HERO SECTION */}
            <section className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration: 0.8}}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tighter">
                    <span className="bg-gradient-to-r from-pink-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">Smart Railway</span><br />
                    <span>Hygiene Management</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
                    Advanced QR-based cleaning verification and real-time asset monitoring, built for the modern railway network.
                </p>
                <div className="flex justify-center">
                    <Button onClick={() => navigate('/auth')} size="lg" className="bg-white text-slate-900 font-bold hover:bg-slate-200 px-8 py-4 text-lg rounded-xl group shadow-lg shadow-violet-500/20">
                    Start Managing Now <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
              </motion.div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-20 bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">A Seamless Workflow</h2>
                    <p className="text-slate-400 mb-12 max-w-2xl mx-auto">From task assignment to final analytics, our platform simplifies every step.</p>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={QrCode} title="Instant QR Scanning" description="Workers scan unique QR codes on-site to start and end cleaning tasks instantly." color="#ec4899" delay={0} />
                        <FeatureCard icon={ShieldCheck} title="Verified Completion" description="Geo-location and timestamp data ensure every task is completed correctly and on time." color="#8b5cf6" delay={0.2} />
                        <FeatureCard icon={AreaChart} title="Real-time Analytics" description="Access a live dashboard to monitor team performance and asset cleanliness." color="#3b82f6" delay={0.4} />
                    </div>
                </div>
            </section>
            
            {/* DASHBOARD MOCKUP SECTION */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Monitor Everything in Real-Time</h2>
                    <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Our command center gives you a bird's-eye view of your entire operation.</p>
                    <DashboardMockup />
                </div>
            </section>
            
            {/* HOW IT WORKS SECTION */}
            <section className="py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Simple as 1-2-3</h2>
                <div className="mt-16 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-0">
                    <div className="text-center w-48"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-pink-500 mx-auto border-2 border-pink-500">1</div><p className="mt-4 font-semibold">Assign & Deploy</p></div>
                    <div className="text-slate-700 font-thin text-3xl hidden md:block mx-8">→</div>
                    <div className="text-center w-48"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-violet-500 mx-auto border-2 border-violet-500">2</div><p className="mt-4 font-semibold">Scan & Verify</p></div>
                    <div className="text-slate-700 font-thin text-3xl hidden md:block mx-8">→</div>
                    <div className="text-center w-48"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500 mx-auto border-2 border-blue-500">3</div><p className="mt-4 font-semibold">Monitor & Analyze</p></div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="py-24 bg-slate-900/50 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Revolutionize Your Operations?</h2>
                 <p className="text-slate-400 mt-4 mb-8 max-w-2xl mx-auto">Join the future of railway management today. No credit card required.</p>
                 <Button onClick={() => navigate('/auth')} size="lg" className="bg-gradient-to-r from-pink-500 to-violet-600 text-white px-8 py-4 text-lg font-semibold rounded-xl group">
                    Get Started For Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                 </Button>
            </section>
        </main>

        <footer className="w-full py-6 text-center border-t border-slate-800">
            <p className="text-slate-500">© {new Date().getFullYear()} Railway Clean. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;