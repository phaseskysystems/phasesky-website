// Modular interactive drone graphic for the hero section
(() => {
  const experience = document.querySelector('.drone-experience');
  const stage = experience?.querySelector('.drone-experience__stage');
  const canvas = experience?.querySelector('.drone-experience__canvas');

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
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 2.2, 9);
      camera.lookAt(0, 0.6, 0);

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const ambient = new THREE.HemisphereLight(0xcfeaff, 0x020305, 0.94);
      const keyLight = new THREE.DirectionalLight(0xe6f4ff, 0.9);
      keyLight.position.set(3.6, 4.8, 4.2);
      const rimLight = new THREE.DirectionalLight(0xbde5ff, 0.62);
      rimLight.position.set(-4.2, 3.2, -3.4);
      scene.add(ambient, keyLight, rimLight);

      const baseBlack = 0x0b0b0e;
      const carbonBlack = 0x101218;
      const softSilver = 0xd8dde5;
      const glowBlue = 0x8ad4ff;

      const chassisMaterial = new THREE.MeshStandardMaterial({ color: baseBlack, metalness: 0.64, roughness: 0.32 });
      const platingMaterial = new THREE.MeshStandardMaterial({
        color: carbonBlack,
        metalness: 0.76,
        roughness: 0.24,
        emissive: 0x0a0d12,
        emissiveIntensity: 0.08
      });
      const accentMaterial = new THREE.MeshStandardMaterial({ color: glowBlue, metalness: 0.44, roughness: 0.32, emissive: 0x8ad4ff, emissiveIntensity: 0.35 });
      const canopyMaterial = new THREE.MeshStandardMaterial({ color: softSilver, metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.85, emissive: glowBlue, emissiveIntensity: 0.12 });
      const motorMaterial = new THREE.MeshStandardMaterial({ color: carbonBlack, metalness: 0.78, roughness: 0.24 });
      const propMaterial = new THREE.MeshStandardMaterial({ color: softSilver, transparent: true, opacity: 0.9, metalness: 0.08, roughness: 0.06 });

      const droneGroup = new THREE.Group();
      scene.add(droneGroup);

      const labelLayer = document.createElement('div');
      labelLayer.className = 'drone-experience__labels';
      stage.append(labelLayer);

      const parts = [];
      const labels = [];
      const createLabel = text => {
        const element = document.createElement('div');
        element.className = 'drone-experience__label';
        element.textContent = text;
        labelLayer.append(element);
        return element;
      };
      const registerPart = (mesh, offset, labelName, labelOffset) => {
        parts.push({ mesh, base: mesh.position.clone(), offset: offset || new THREE.Vector3() });
        if (labelName) {
          labels.push({ target: mesh, element: createLabel(labelName), labelOffset: labelOffset || { x: 0, y: -26 } });
        }
      };

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
          new THREE.LineBasicMaterial({ color: 0xaadfff, transparent: true, opacity: 0.24 })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        droneGroup.add(line);
      };

      [hull, spine].forEach(addEdges);

      const armMaterial = new THREE.MeshStandardMaterial({ color: carbonBlack, metalness: 0.78, roughness: 0.26 });

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

        registerPart(armGroup, new THREE.Vector3(0.6 * xSign, 0.16, 0.6 * zSign));

        if (xSign === 1 && zSign === 1) {
          const motorLabelAnchor = new THREE.Object3D();
          motorLabelAnchor.position.set(2.1 * xSign, 0.62, 2.1 * zSign);
          armGroup.add(motorLabelAnchor);
          labels.push({ target: motorLabelAnchor, element: createLabel('MOTORS'), labelOffset: { x: 26, y: -8 } });

          const propLabelAnchor = new THREE.Object3D();
          propLabelAnchor.position.set(2.1 * xSign, 0.9, 2.1 * zSign);
          armGroup.add(propLabelAnchor);
          labels.push({ target: propLabelAnchor, element: createLabel('PROPS'), labelOffset: { x: 18, y: -34 } });
        }
      };

      createArm(1, 1);
      createArm(-1, 1);
      createArm(1, -1);
      createArm(-1, -1);

      const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.26, 28, 1, true), accentMaterial);
      intake.rotation.z = Math.PI / 2;
      intake.position.set(-1.02, 0.54, 0.32);
      droneGroup.add(intake);

      const ledSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 32, 32),
        new THREE.MeshStandardMaterial({ color: glowBlue, emissive: 0x9adfff, emissiveIntensity: 1.0 })
      );
      ledSphere.position.set(1.05, 0.94, -0.62);
      droneGroup.add(ledSphere);

      const navBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 24, 24),
        new THREE.MeshStandardMaterial({ color: glowBlue, emissive: glowBlue, emissiveIntensity: 0.58, transparent: true, opacity: 0.9 })
      );
      navBeacon.position.set(-1.2, 0.88, 0.68);
      droneGroup.add(navBeacon);

      const undercarriage = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.62), motorMaterial);
      undercarriage.position.y = -0.06;
      droneGroup.add(undercarriage);

      registerPart(hull, new THREE.Vector3(0, 0.32, 0), 'FRAME', { x: -12, y: 22 });
      registerPart(spine, new THREE.Vector3(0, 0.54, 0), 'PCB', { x: 8, y: -22 });
      registerPart(canopy, new THREE.Vector3(0, 0.74, 0));
      registerPart(accentStrip, new THREE.Vector3(0.2, 0.22, 0));
      registerPart(keel, new THREE.Vector3(0, 0.22, 0));
      registerPart(intake, new THREE.Vector3(-0.32, 0.22, 0), 'POWER', { x: -48, y: -6 });
      registerPart(ledSphere, new THREE.Vector3(0.08, 0.1, -0.06));
      registerPart(navBeacon, new THREE.Vector3(-0.08, 0.1, 0.08));
      registerPart(undercarriage, new THREE.Vector3(0, -0.28, 0));

      let explosionProgress = 0;
      let explosionTarget = 0;
      const spinSpeed = prefersReducedMotion ? 0 : 0.24;

      const toggleExploded = () => {
        explosionTarget = explosionTarget === 1 ? 0 : 1;
        experience.classList.toggle('drone-experience--glow', explosionTarget === 1);
      };

      stage.addEventListener('click', toggleExploded);

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

      const updateLabels = () => {
        const rect = stage.getBoundingClientRect();
        labels.forEach(({ target, element, labelOffset }) => {
          const world = target.getWorldPosition(new THREE.Vector3());
          world.project(camera);
          const x = (world.x * 0.5 + 0.5) * rect.width;
          const y = (-world.y * 0.5 + 0.5) * rect.height;
          const offsetX = labelOffset?.x || 0;
          const offsetY = labelOffset?.y || 0;
          const labelX = x + offsetX;
          const labelY = y + offsetY;
          element.style.left = `${labelX}px`;
          element.style.top = `${labelY}px`;
          const dx = x - labelX;
          const dy = y - labelY;
          const length = Math.min(Math.hypot(dx, dy), 42);
          const angle = Math.atan2(dy, dx);
          element.style.setProperty('--leader-length', `${length}px`);
          element.style.setProperty('--leader-angle', `${angle}rad`);
          const visibility = prefersReducedMotion ? explosionTarget : explosionProgress;
          element.style.opacity = visibility;
        });
      };

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isInView) return;

        const delta = prefersReducedMotion ? 1 : 0.12;
        explosionProgress += (explosionTarget - explosionProgress) * delta;
        const easedExplosion = prefersReducedMotion
          ? explosionTarget
          : THREE.MathUtils.smoothstep(explosionProgress, 0, 1);

        parts.forEach(({ mesh, base, offset }) => {
          mesh.position.lerpVectors(base, base.clone().add(offset), easedExplosion);
        });

        scene.traverse(child => {
          if (child.userData.isBlade && spinSpeed > 0) {
            child.rotation.y += spinSpeed * 0.8;
          }
        });

        updateLabels();
        renderer.render(scene, camera);
      };

      experience.classList.remove('drone-experience--static');
      experience.classList.add('drone-experience--active');
      animate();
      isInteractive = true;
    } catch (error) {
      console.warn('WebGL drone experience failed, falling back to static view.', error);
      setStaticFallback();
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
