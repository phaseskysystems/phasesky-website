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
      camera.position.set(0, 3, 10);

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const ambient = new THREE.AmbientLight(0x6688ff, 0.7);
      const keyLight = new THREE.DirectionalLight(0x99bbff, 0.9);
      keyLight.position.set(3, 5, 4);
      scene.add(ambient, keyLight);

      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x92a5d6, metalness: 0.4, roughness: 0.35 });
      const shellMaterial = new THREE.MeshStandardMaterial({ color: 0x9eb7ff, emissive: 0x204c9d, emissiveIntensity: 0.3, roughness: 0.6 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 2), bodyMaterial);
      body.position.y = 0.25;
      scene.add(body);

      const topShell = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.6), shellMaterial);
      topShell.position.y = 0.75;
      scene.add(topShell);

      const armMaterial = new THREE.MeshStandardMaterial({ color: 0x6f7d9a, metalness: 0.55, roughness: 0.28 });
      const createArm = (x, z) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.35), armMaterial);
        arm.rotation.y = Math.PI / 4;
        arm.position.set(x, 0.1, z);
        scene.add(arm);

        const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.4, 24), shellMaterial);
        rotor.rotation.x = Math.PI / 2;
        rotor.position.set(x * 1.6, 0.55, z * 1.6);
        scene.add(rotor);

        const propMaterial = new THREE.MeshStandardMaterial({ color: 0xb9c6e6, transparent: true, opacity: 0.9 });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.2), propMaterial);
        blade.position.set(rotor.position.x, rotor.position.y + 0.25, rotor.position.z);
        blade.userData.isBlade = true;
        scene.add(blade);
      };

      createArm(1.5, 1.1);
      createArm(-1.5, 1.1);
      createArm(1.5, -1.1);
      createArm(-1.5, -1.1);

      const ledSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x98b9ff, emissive: 0x4d7dff, emissiveIntensity: 1.5 })
      );
      ledSphere.position.set(0.9, 0.95, -0.6);
      scene.add(ledSphere);

      const targetRotation = { x: 0.08, y: 0 };
      let hoverGlow = 0;

      const onPointerMove = event => {
        const rect = stage.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        targetRotation.y = nx * 0.4;
        targetRotation.x = 0.08 - ny * 0.3;
      };

      const onPointerEnter = () => {
        hoverGlow = 1;
        experience.classList.add('drone-experience--glow');
      };

      const onPointerLeave = () => {
        hoverGlow = 0;
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

        camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.04;
        camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.04;

        scene.traverse(child => {
          if (child.userData.isBlade && !prefersReducedMotion) {
            child.rotation.y += 0.18;
          }
        });

        ledSphere.material.emissiveIntensity = 1.1 + hoverGlow * 0.6;
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
