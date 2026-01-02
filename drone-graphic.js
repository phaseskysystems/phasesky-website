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
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 2.2, 9);
      camera.lookAt(0, 0.6, 0);

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const ambient = new THREE.HemisphereLight(0x9fc6ff, 0x1a1a1d, 0.82);
      const keyLight = new THREE.DirectionalLight(0xcde5ff, 0.95);
      keyLight.position.set(3.6, 5, 4.2);
      const rimLight = new THREE.DirectionalLight(0x82bbff, 0.62);
      rimLight.position.set(-4.2, 3.2, -3.4);
      scene.add(ambient, keyLight, rimLight);

      const matteBlack = 0x0c0c12;
      const deepGraphite = 0x1b1b21;
      const softSilver = 0xd8dde5;
      const coolBlue = 0x8fc7ff;

      const chassisMaterial = new THREE.MeshStandardMaterial({ color: matteBlack, metalness: 0.62, roughness: 0.36 });
      const platingMaterial = new THREE.MeshStandardMaterial({ color: deepGraphite, metalness: 0.74, roughness: 0.28, emissive: 0x1f2730, emissiveIntensity: 0.08 });
      const accentMaterial = new THREE.MeshStandardMaterial({ color: coolBlue, metalness: 0.42, roughness: 0.32, emissive: 0x4a7fb1, emissiveIntensity: 0.38 });
      const canopyMaterial = new THREE.MeshStandardMaterial({ color: softSilver, metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.8, emissive: 0x4a7fb1, emissiveIntensity: 0.15 });
      const motorMaterial = new THREE.MeshStandardMaterial({ color: deepGraphite, metalness: 0.76, roughness: 0.24 });
      const propMaterial = new THREE.MeshStandardMaterial({ color: softSilver, transparent: true, opacity: 0.9, metalness: 0.08, roughness: 0.06 });

      const droneGroup = new THREE.Group();
      scene.add(droneGroup);

      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.64, 2.24), chassisMaterial);
      hull.position.y = 0.36;
      droneGroup.add(hull);

      const keel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.62), platingMaterial);
      keel.position.y = 0.08;
      droneGroup.add(keel);

      const spine = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 1.48), platingMaterial);
      spine.position.y = 0.84;
      droneGroup.add(spine);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2, 0.26, 1.28), canopyMaterial);
      canopy.position.set(0, 1.04, 0);
      canopy.rotation.y = -0.06;
      droneGroup.add(canopy);

      const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 1.6), accentMaterial);
      accentStrip.position.set(1.2, 0.84, 0);
      droneGroup.add(accentStrip);

      const addEdges = mesh => {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 50);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x6d88ad, transparent: true, opacity: 0.25 })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        droneGroup.add(line);
      };

      [hull, spine].forEach(addEdges);

      const parts = [];
      const registerPart = (mesh, offset) => {
        parts.push({ mesh, base: mesh.position.clone(), offset: offset || new THREE.Vector3() });
      };

      const armMaterial = new THREE.MeshStandardMaterial({ color: deepGraphite, metalness: 0.78, roughness: 0.26 });

      const createArm = (xSign, zSign) => {
        const armGroup = new THREE.Group();

        const sparPath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.15 * xSign, 0.42, 0.95 * zSign),
          new THREE.Vector3(1.38 * xSign, 0.48, 1.16 * zSign),
          new THREE.Vector3(1.58 * xSign, 0.46, 1.38 * zSign),
          new THREE.Vector3(1.78 * xSign, 0.5, 1.62 * zSign)
        ]);
        const spar = new THREE.Mesh(new THREE.TubeGeometry(sparPath, 40, 0.12, 24, false), armMaterial);
        armGroup.add(spar);

        const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 20), armMaterial);
        brace.rotation.z = Math.PI / 2;
        brace.position.set(1.34 * xSign, 0.34, 1.04 * zSign);
        armGroup.add(brace);

        const motor = new THREE.Group();
        const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.28, 28), motorMaterial);
        stator.rotation.x = Math.PI / 2;
        stator.position.set(1.9 * xSign, 0.46, 1.74 * zSign);
        motor.add(stator);

        const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 32), motorMaterial);
        bell.rotation.x = Math.PI / 2;
        bell.position.set(1.9 * xSign, 0.6, 1.74 * zSign);
        motor.add(bell);

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), motorMaterial);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.set(1.9 * xSign, 0.76, 1.74 * zSign);
        motor.add(shaft);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.14), propMaterial);
        blade.position.set(1.9 * xSign, 0.8, 1.74 * zSign);
        blade.userData.isBlade = true;
        motor.add(blade);

        armGroup.add(motor);

        armGroup.position.set(0, 0, 0);
        droneGroup.add(armGroup);

        registerPart(armGroup, new THREE.Vector3(0.18 * xSign, 0.1, 0.22 * zSign));
      };

      createArm(1, 1);
      createArm(-1, 1);
      createArm(1, -1);
      createArm(-1, -1);

      const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.26, 28, 1, true), accentMaterial);
      intake.rotation.z = Math.PI / 2;
      intake.position.set(-1.02, 0.54, 0.32);
      droneGroup.add(intake);
      registerPart(intake, new THREE.Vector3(-0.12, 0.08, 0));

      const ledSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 32, 32),
        new THREE.MeshStandardMaterial({ color: coolBlue, emissive: 0x6db4ff, emissiveIntensity: 1.1 })
      );
      ledSphere.position.set(1.05, 0.94, -0.62);
      droneGroup.add(ledSphere);
      registerPart(ledSphere, new THREE.Vector3(0.04, 0.06, -0.06));

      const navBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 24, 24),
        new THREE.MeshStandardMaterial({ color: coolBlue, emissive: coolBlue, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 })
      );
      navBeacon.position.set(-1.2, 0.88, 0.68);
      droneGroup.add(navBeacon);
      registerPart(navBeacon, new THREE.Vector3(-0.06, 0.08, 0.06));

      const undercarriage = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.62), motorMaterial);
      undercarriage.position.y = -0.06;
      droneGroup.add(undercarriage);
      registerPart(undercarriage, new THREE.Vector3(0, -0.12, 0));

      registerPart(hull, new THREE.Vector3(0, 0.12, 0));
      registerPart(spine, new THREE.Vector3(0.08, 0.16, 0));
      registerPart(canopy, new THREE.Vector3(0, 0.18, 0));
      registerPart(accentStrip, new THREE.Vector3(0.12, 0.1, 0));

      const clock = new THREE.Clock();
      const targetRotation = { x: 0, y: 0 };
      const currentRotation = { x: 0, y: 0 };
      let hoverGlow = 0;
      let spinActive = false;
      let engaged = false;
      let explosionProgress = 0;
      let explosionTarget = 0;
      let explodedAt = 0;
      let holdActive = false;
      let reassembleTimeout;
      const minExplodedMs = 5000;

      const onPointerMove = event => {
        const rect = stage.getBoundingClientRect();
        const nx = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
        const ny = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
        targetRotation.y = nx * 0.28;
        targetRotation.x = -ny * 0.22;
        spinActive = true;
        engaged = true;
      };

      const onPointerEnter = () => {
        hoverGlow = 1;
        engaged = true;
        experience.classList.add('drone-experience--glow');
      };

      const onPointerLeave = () => {
        hoverGlow = 0;
        targetRotation.x = 0;
        targetRotation.y = 0;
        experience.classList.remove('drone-experience--glow');
      };

      const setExploded = () => {
        explosionTarget = 1;
        explodedAt = performance.now();
        holdActive = true;
        clearTimeout(reassembleTimeout);
      };

      const reassemble = () => {
        explosionTarget = 0;
        holdActive = false;
      };

      const queueReassemble = () => {
        const elapsed = performance.now() - explodedAt;
        const remaining = Math.max(0, minExplodedMs - elapsed);
        clearTimeout(reassembleTimeout);
        reassembleTimeout = setTimeout(() => {
          if (!holdActive) reassemble();
        }, remaining);
      };

      const onPointerDown = () => {
        if (explosionTarget === 1) return;
        setExploded();
        engaged = true;
      };

      const onPointerUp = () => {
        if (explosionTarget === 0) return;
        holdActive = false;
        queueReassemble();
      };

      stage.addEventListener('pointermove', onPointerMove, { passive: true });
      stage.addEventListener('pointerenter', onPointerEnter, { passive: true });
      stage.addEventListener('pointerleave', onPointerLeave, { passive: true });
      stage.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointerup', onPointerUp);

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
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
        droneGroup.rotation.set(currentRotation.x, currentRotation.y, 0);

        explosionProgress += (explosionTarget - explosionProgress) * 0.08;
        const easedExplosion = THREE.MathUtils.smootherstep(explosionProgress, 0, 1);

        parts.forEach(({ mesh, base, offset }) => {
          mesh.position.lerpVectors(base, base.clone().add(offset), easedExplosion);
        });

        scene.traverse(child => {
          if (child.userData.isBlade && spinActive && !prefersReducedMotion) {
            child.rotation.y += 0.28;
          }
        });

        const beaconPulse = engaged ? 0.12 * Math.sin(t * 3.2) + 0.88 : 0.9;
        navBeacon.material.emissiveIntensity = beaconPulse * 0.7;
        ledSphere.material.emissiveIntensity = engaged
          ? 0.95 + hoverGlow * 0.55 + Math.sin(t * 2.8) * 0.05
          : 0.95;
        renderer.render(scene, camera);
      };

      experience.classList.remove('drone-experience--static');
      experience.classList.add('drone-experience--active');
      animate();
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
