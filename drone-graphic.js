// Modular interactive drone graphic for the hero section
(() => {
  const experience = document.querySelector('.drone-experience');
  const stage = experience?.querySelector('.drone-experience__stage');
  const canvas = experience?.querySelector('.drone-experience__canvas');
  const layers = experience?.querySelectorAll('.drone-experience__layer') || [];

  if (!experience || !stage || !canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  let animationFrameId;
  let resizeObserver;
  let isInteractive = false;
  let isInView = false;

  const setStaticFallback = () => {
    experience.classList.add('drone-experience--static');
    experience.classList.remove('drone-experience--active');
  };

  const bindParallaxFallback = () => {
    if (prefersReducedMotion) {
      layers.forEach(layer => (layer.style.transform = 'translate3d(0,0,0)'));
      return;
    }

    const handleMove = event => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      layers.forEach((layer, index) => {
        const depth = (index + 1) * 6;
        layer.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
      });
    };

    const handleLeave = () => {
      layers.forEach(layer => (layer.style.transform = 'translate3d(0,0,0)'));
    };

    stage.addEventListener('pointermove', handleMove, { passive: true });
    stage.addEventListener('pointerleave', handleLeave, { passive: true });
  };

  const startScrollEffect = () => {
    if (prefersReducedMotion) return;
    let ticking = false;
    const updateTilt = () => {
      ticking = false;
      const rect = stage.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const distance = Math.max(0, 1 - Math.abs(rect.top + rect.height / 2 - viewportCenter) / viewportCenter);
      const angle = distance * 2;
      stage.style.transform = `perspective(800px) rotateX(${angle}deg)`;
      stage.style.opacity = 0.85 + distance * 0.15;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateTilt);
      }
    };

    updateTilt();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  const disposeThree = () => {
    cancelAnimationFrame(animationFrameId);
    resizeObserver?.disconnect();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement?.remove();
      renderer = undefined;
    }
  };

  const startThree = async () => {
    if (prefersReducedMotion) {
      setStaticFallback();
      bindParallaxFallback();
      return;
    }

    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 2.4, 8.2);

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const ambient = new THREE.HemisphereLight(0x9bbdff, 0x0b1324, 0.65);
      const keyLight = new THREE.DirectionalLight(0xb5ccff, 0.9);
      keyLight.position.set(3, 5, 4);
      const rimLight = new THREE.DirectionalLight(0x4d7dff, 0.55);
      rimLight.position.set(-4, 3, -3);
      scene.add(ambient, keyLight, rimLight);

      const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1b2f, metalness: 0.72, roughness: 0.28 });
      const platingMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2f4f, metalness: 0.82, roughness: 0.2, emissive: 0x162c55, emissiveIntensity: 0.12 });
      const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x7ea6ff, metalness: 0.5, roughness: 0.35, emissive: 0x2a5fd1, emissiveIntensity: 0.35 });
      const glassMaterial = new THREE.MeshStandardMaterial({ color: 0xa9c6ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.7, emissive: 0x1d3a6f, emissiveIntensity: 0.2 });

      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 2.4), chassisMaterial);
      hull.position.y = 0.32;
      scene.add(hull);

      const keel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 0.6), platingMaterial);
      keel.position.y = 0.05;
      scene.add(keel);

      const spine = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.24, 1.6), platingMaterial);
      spine.position.y = 0.82;
      scene.add(spine);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.22, 1.35), glassMaterial);
      canopy.position.set(-0.08, 1.05, -0.06);
      canopy.rotation.y = -0.08;
      scene.add(canopy);

      const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 1.8), accentMaterial);
      accentStrip.position.set(1.35, 0.82, -0.1);
      scene.add(accentStrip);

      const armMaterial = new THREE.MeshStandardMaterial({ color: 0x111a2b, metalness: 0.85, roughness: 0.25 });
      const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3e5f, metalness: 0.78, roughness: 0.22, emissive: 0x0d2145, emissiveIntensity: 0.18 });
      const propMaterial = new THREE.MeshStandardMaterial({ color: 0xc8d7f5, transparent: true, opacity: 0.92, metalness: 0.1, roughness: 0.05 });

      const addEdges = mesh => {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 50);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x3a4f72, transparent: true, opacity: 0.32 })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        scene.add(line);
      };

      [hull, spine].forEach(addEdges);

      const createArm = (x, z) => {
        const group = new THREE.Group();
        const anchor = new THREE.Vector3(x * 0.92, 0.32, z * 0.92);
        const midCurve = new THREE.Vector3(x * 1.12, 0.52, z * 1.04);
        const leading = new THREE.Vector3(x * 1.32, 0.46, z * 1.28);
        const outboard = new THREE.Vector3(x * 1.54, 0.6, z * 1.52);

        const sparCurve = new THREE.CatmullRomCurve3([anchor, midCurve, leading, outboard]);
        const spar = new THREE.Mesh(new THREE.TubeGeometry(sparCurve, 36, 0.1, 22, false), armMaterial);
        group.add(spar);

        const shroud = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.45, 16, 32), platingMaterial);
        shroud.rotation.z = Math.PI / 2;
        shroud.rotation.y = Math.PI / 4;
        shroud.position.set(x * 0.88, 0.28, z * 0.88);
        group.add(shroud);

        const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.18, 1.9, 24), platingMaterial);
        fin.rotation.z = Math.PI / 2;
        fin.rotation.y = Math.PI / 4;
        fin.position.set(x * 1.18, 0.42, z * 1.14);
        group.add(fin);

        const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.45, 32), rotorMaterial);
        rotor.rotation.x = Math.PI / 2;
        rotor.position.copy(outboard);
        group.add(rotor);

        const guard = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.028, 14, 48), accentMaterial);
        guard.position.copy(rotor.position);
        guard.rotation.x = Math.PI / 2;
        group.add(guard);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.04, 0.16), propMaterial);
        blade.position.set(rotor.position.x, rotor.position.y + 0.24, rotor.position.z);
        blade.userData.isBlade = true;
        group.add(blade);

        const bladeHalo = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 0.62, 36, 1, 0, Math.PI * 2),
          new THREE.MeshBasicMaterial({ color: 0x7ea6ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
        );
        bladeHalo.rotation.x = Math.PI / 2;
        bladeHalo.position.set(rotor.position.x, rotor.position.y + 0.01, rotor.position.z);
        group.add(bladeHalo);

        scene.add(group);
      };

      createArm(1.5, 1.1);
      createArm(-1.5, 1.1);
      createArm(1.5, -1.1);
      createArm(-1.5, -1.1);

      const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.3, 28, 1, true), accentMaterial);
      intake.rotation.z = Math.PI / 2;
      intake.position.set(-1.1, 0.54, 0.35);
      scene.add(intake);

      const ledSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x9bc2ff, emissive: 0x4d7dff, emissiveIntensity: 1.35 })
      );
      ledSphere.position.set(1.15, 0.96, -0.66);
      scene.add(ledSphere);

      const navBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x7cf3ff, emissive: 0x7cf3ff, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 })
      );
      navBeacon.position.set(-1.3, 0.9, 0.72);
      scene.add(navBeacon);

      const undercarriage = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.8), rotorMaterial);
      undercarriage.position.y = -0.08;
      scene.add(undercarriage);

      const floatingParts = [hull, spine, canopy, accentStrip];
      const clock = new THREE.Clock();
      const targetRotation = { x: 0.05, y: 0 };
      let hoverGlow = 0;

      const onPointerMove = event => {
        const rect = stage.getBoundingClientRect();
        const nx = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
        const ny = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
        targetRotation.y = nx * 0.34;
        targetRotation.x = 0.04 - ny * 0.22;
      };

      const onPointerEnter = () => {
        hoverGlow = 1;
        experience.classList.add('drone-experience--glow');
      };

      const onPointerLeave = () => {
        hoverGlow = 0;
        targetRotation.x = 0.05;
        targetRotation.y = 0;
        experience.classList.remove('drone-experience--glow');
      };

      stage.addEventListener('pointermove', onPointerMove, { passive: true });
      stage.addEventListener('pointerenter', onPointerEnter, { passive: true });
      stage.addEventListener('pointerleave', onPointerLeave, { passive: true });

      const handleResize = () => {
        const { width, height } = stage.getBoundingClientRect();
        const aspect = width / height;
        renderer.setSize(width, height, false);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(stage);
      handleResize();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isInView) return;

        const t = clock.getElapsedTime();

        camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.06;
        camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.06;

        floatingParts.forEach((part, index) => {
          part.position.y += Math.sin(t * 1.2 + index * 0.8) * 0.002;
        });

        scene.traverse(child => {
          if (child.userData.isBlade && !prefersReducedMotion) {
            child.rotation.y += 0.2;
          }
        });

        const beaconPulse = 0.15 * Math.sin(t * 4) + 0.9;
        navBeacon.material.emissiveIntensity = beaconPulse * 0.8;
        ledSphere.material.emissiveIntensity = 1.05 + hoverGlow * 0.65 + Math.sin(t * 3) * 0.05;
        renderer.render(scene, camera);
      };

      experience.classList.remove('drone-experience--static');
      experience.classList.add('drone-experience--active');
      animate();
      startScrollEffect();
      isInteractive = true;
    } catch (error) {
      console.warn('WebGL drone experience failed, falling back to parallax.', error);
      setStaticFallback();
      bindParallaxFallback();
    }
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        isInView = entry.isIntersecting;
        if (entry.isIntersecting && !isInteractive) {
          observer.disconnect();
          experience.classList.add('drone-experience--static');
          startThree();
        }
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(stage);

  window.addEventListener('beforeunload', disposeThree);
})();
