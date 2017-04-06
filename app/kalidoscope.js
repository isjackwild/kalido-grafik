import { Events, Engine, World, Bodies, Body, Render, MouseConstraint, Mouse } from 'matter-js';
const paper = require('paper');
import Victor from 'victor';
paper.install(window);
import 'gsap';
import _ from 'lodash';
import { hexToRgb, rgbToHex } from './lib/colour.js';

import { SHAPE_COUNT, WALL_RESTITUTION, BODY_RESTITUTION, BODY_FRICTION, BODY_AIR_FRICTION, BODY_BASE_MASS, BODY_RAND_MASS, BODY_COLLISSION_FORCE, WALL_THICKNESS, SHAPE_RADIUS, GRAVITY_STRENGTH, OWN_GRAVITY_STRENGTH, CLICK_STRENGTH, EXAMPLE_SVG, MAX_VELOCITY, MAX_ANGULAR_VELOCITY } from './CONSTANTS.js';


const Kalidoscope = () => {
	let raf, i = 0, x = 0, then, now, tick = 0, delta = 1, isInit = false;
	let walls = [], bodies = [], shapes = [[],[], [], []], collissions = [];
	let engine;
	let colorTl, currentColor;

	const canvas = document.getElementsByClassName('interactive-background')[0];
	paper.setup(canvas);

	const colors = canvas.dataset.colors ? canvas.dataset.colors.split(',') : null;

	const svgFromString = (string) => {
		const template = document.createElement('template');
		template.innerHTML = string;
		return template.content.firstElementChild;
	}

	// const customSVG = canvas.dataset.customSvg ? canvas.dataset.customSvg : null;
	const customSVG = svgFromString(EXAMPLE_SVG);
	console.log(customSVG);

	project.currentStyle = {
		strokeColor: '#000000',
		fillColor: colors && colors.length ? colors[colors.length -1] : '#000000',
		strokeWidth: 0,
		opacity: 0.5,
	};
	
	const wallOptions = {
		isStatic: true,
		restitution: WALL_RESTITUTION,
	}

	const bodyOptions = {
		restitution: BODY_RESTITUTION,
		friction: BODY_FRICTION,
		frictionAir: BODY_AIR_FRICTION,
		frictionStatic: 0,
		density: 0.001,
	}

	const init = () => {
		if (colors && colors.length) currentColor = hexToRgb(colors[colors.length -1]);

		engine = Engine.create();
		walls = [
			Bodies.rectangle(
				window.innerWidth * -0.25,
				window.innerHeight * -0.5 - (WALL_THICKNESS * 0.5),
				window.innerWidth * 0.5,
				WALL_THICKNESS,
				wallOptions
			), //top
			Bodies.rectangle(
				window.innerWidth * -0.25,
				WALL_THICKNESS * 0.5,
				window.innerWidth * 0.5,
				WALL_THICKNESS,
				wallOptions
			), //bottom

			Bodies.rectangle(
				window.innerWidth * -0.5 - (WALL_THICKNESS * 0.5),
				window.innerHeight * -0.25,
				WALL_THICKNESS,
				window.innerHeight * 0.5,
				wallOptions
			), //left
			Bodies.rectangle(
				(WALL_THICKNESS * 0.5),
				window.innerHeight * -0.25,
				WALL_THICKNESS,
				window.innerHeight * 0.5,
				wallOptions
			), //right
		];
		walls.forEach(w => w.label = 'wall');
		
		const len = Math.sqrt((window.innerWidth * window.innerWidth) + (window.innerHeight * window.innerHeight)) / 2 * 0.8;
		// const len = Math.min(window.innerWidth, window.innerHeight) * 0.5;

		for (let i = 0; i < SHAPE_COUNT; i++){
			const scale = (((len - SHAPE_RADIUS) / SHAPE_COUNT) * i) + SHAPE_RADIUS * 2;
			const pos = new Victor(-1, -1).normalize().rotateByDeg(Math.random() * 45 - 90).multiply(new Victor(scale * -1, scale * -1));
			if (pos.y < (window.innerHeight * -1) + SHAPE_RADIUS) pos.y = (window.innerHeight * -1) + SHAPE_RADIUS + 10;
			if (pos.x < (window.innerWidth * -1) + SHAPE_RADIUS) pos.x = (window.innerWidth * -1) + SHAPE_RADIUS + 10;

			bodyOptions.density = Math.random() * BODY_RAND_MASS + BODY_BASE_MASS;
			// if (Math.random() > 0.5) bodyOptions.density *= -1;
			// b.mass = 
			// bodyOptions.mass = -0.00000001;
			const b = Bodies.circle(pos.x, pos.y, SHAPE_RADIUS, bodyOptions);
			b.velocity = new Victor(0, 0);
			b.label = 'shape';
			b.gravity = { x: 0, y: 0 };
			b.gravitySpeed = { x: Math.random() * 0.005 + 0.003, y: Math.random() * 0.005 + 0.003 };
			// b.maxDensity = Math.random() * BODY_RAND_MASS + BODY_BASE_MASS;
			// b.densityOffset = Math.random() * 1000;
			// b.densitySpeed = Math.random() * 0.012;

			bodies.push(b)
		}

		const generatePath = (p, s) => {
			if (customSVG === undefined) return new Path.Circle(view.center.clone().add(p), SHAPE_RADIUS);
			const svg = project.importSVG(customSVG);
			svg.strokeWidth = 0;
			svg.bounds.width = SHAPE_RADIUS * 2;
			svg.bounds.height = SHAPE_RADIUS * 2;
			svg.scale(s.x, s.y);
			console.log(svg);
			return svg;
		}

		bodies.forEach(b => {
			const p0 = new Point (b.position.x, b.position.y);
			const pa0 = generatePath(p0, { x: 1, y: 1 });
			pa0.opacity = 0;
			shapes[0].push(pa0);

			const p1 = new Point (b.position.x * -1, b.position.y);
			const pa1 = generatePath(p1, { x: -1, y: 1 });
			pa1.opacity = 0;
			shapes[1].push(pa1);

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			const pa2 = generatePath(p2, { x: -1, y: -1 });
			pa2.opacity = 0;
			shapes[2].push(pa2);

			const p3 = new Point (b.position.x, b.position.y * -1);
			const pa3 = generatePath(p3, { x: 1, y: -1 });
			pa3.opacity = 0;
			shapes[3].push(pa3);
		});

		const allBodies = [...walls, ...bodies]
		now = new Date().getTime();
		tick = Math.random() * 5000;
		World.add(engine.world, allBodies);
		Engine.run(engine);
		Events.on(engine, 'afterUpdate', update);
		Events.on(engine, 'beforeUpdate', onBeforeUpdate);
		Events.on(engine, 'collisionStart', onCollisionStart);
		window.addEventListener('mousedown', onClick);
		window.addEventListener('touchstart', onClick);

		if (colors.length) {
			colorTl = new TimelineLite({ onComplete: () => colorTl.restart() });
			colors.forEach(c => {
				colorTl.to(currentColor, 5, {...hexToRgb(c), ease: Power0.easeNone, onUpdate: updateColor });
			});
		}

		show();
		isInit = true;
	}

	const kill = () => {
		if (!isInit) return;
		isInit = false;
		Engine.clear(engine);
		Events.off(engine, 'afterUpdate', update);
		Events.off(engine, 'beforeUpdate', onBeforeUpdate);
		Events.off(engine, 'collisionStart', onCollisionStart);
		if (colorTl) colorTl.kill();
		engine = undefined;
		then = undefined;
		project.activeLayer.removeChildren();
		window.removeEventListener('mousedown', onClick);
		window.removeEventListener('touchstart', onClick);
		walls = [], bodies = [], shapes = [[],[], [], []], tick = 0;
	}

	const onResize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.height = window.innerHeight + 'px';
		canvas.style.width = window.innerWidth + 'px';
		view.size.set(window.innerWidth, window.innerHeight);
		view.viewSize.set(window.innerWidth, window.innerHeight);
		kill();
		requestAnimationFrame(() => {
			init();
		});
	}

	const show = () => {
		shapes.forEach(s => TweenMax.staggerTo(s, 1.2, { opacity: 1, ease: Sine.easeInOut }, 0.12));
	}

	const hide = () => {
		shapes.forEach(s => TweenMax.staggerTo(s, 1.2, { opacity: 0, ease: Sine.easeInOut }, 0.12));
	}

	const updateColor = () => {
		const c = `rgb(${Math.floor(currentColor.r)}, ${Math.floor(currentColor.g)}, ${Math.floor(currentColor.b)})`;
		_.flattenDeep(shapes).forEach(s => s.fillColor = c);
	}

	const onClick = (e) => {
		let x = e.touches ? e.touches[0].clientX : e.clientX;
		let y = e.touches ? e.touches[0].clientY : e.clientY;

		x -= window.innerWidth * 0.5;
		y -= window.innerHeight * 0.5;



		if (x > 0) x *= -1;
		if (y > 0) y *= -1;

		const mP = new Victor(x, y);

		bodies.forEach(b => {
			const mP = new Victor(x, y);
			const dist = mP.distance(new Victor(b.position.x, b.position.y));
			let scale = (1 - dist / Math.min(window.innerWidth * 0.3, window.innerHeight * 0.3)) * CLICK_STRENGTH;
			scale = Math.max(scale, 0);
			const force = new Victor(
				b.position.x - mP.x,
				b.position.y - mP.y,
			).norm().multiply(new Victor(scale, scale));

			Body.applyForce(b, mP, force);
		});
	};

	const onBeforeUpdate = () => {
		collissions.forEach(p => {
			const forceA = new Victor(
				p.bodyA.position.x - p.bodyB.position.x,
				p.bodyA.position.y - p.bodyB.position.y,
			).norm().multiply(new Victor(BODY_COLLISSION_FORCE, BODY_COLLISSION_FORCE));
			Body.applyForce(p.bodyA, p.bodyB.position, forceA);

			const forceB = new Victor(
				p.bodyB.position.x - p.bodyA.position.x,
				p.bodyB.position.y - p.bodyA.position.y,
			).norm().multiply(new Victor(BODY_COLLISSION_FORCE, BODY_COLLISSION_FORCE));
			Body.applyForce(p.bodyB, p.bodyA.position, forceB);
		});

		collissions = [];
	}

	const onCollisionStart = (e) => {
		const pairs = e.pairs;
		pairs.forEach(p => {
			collissions.push(p);
		});
	}

	const update = () => {
		if (then) delta = (now - then) / 16.666;
		then = now;
		now = new Date().getTime();
		tick += delta;
		// console.log(tick);

		engine.world.gravity.x = Math.cos(tick * 0.006) * GRAVITY_STRENGTH;
		engine.world.gravity.y = Math.cos(tick * 0.01) * GRAVITY_STRENGTH;
		// engine.world.gravity.x = 0;
		// engine.world.gravity.y = 0;


		bodies.forEach((b, i) => {
			// const d = Math.sin(tick * b.densitySpeed) * b.maxDensity;
			// Body.setMass(b, d);
			// if (i === 0) console.log(d);
			
			b.gravity.x = Math.cos((tick + (i * 123)) * b.gravitySpeed.x) * OWN_GRAVITY_STRENGTH;
			b.gravity.y = Math.cos((tick + (i * 123)) * b.gravitySpeed.y) * OWN_GRAVITY_STRENGTH;

			// if (i === 0) console.log(b.gravity);
			Body.applyForce(b, b.position, b.gravity);

			if (b.velocity.length() > MAX_VELOCITY) Body.setVelocity(b, b.velocity.normalize().multiply({ x: MAX_VELOCITY, y: MAX_VELOCITY }));
			if (b.angularVelocity > MAX_ANGULAR_VELOCITY) Body.setAngularVelocity(b, MAX_ANGULAR_VELOCITY);


			const p0 = new Point (b.position.x, b.position.y);
			shapes[0][i].position = view.center.clone().add(p0);
			shapes[0][i].rotation = b.angle;

			const p1 = new Point (b.position.x * -1, b.position.y);
			shapes[1][i].position = view.center.clone().add(p1);
			shapes[1][i].rotation = (b.angle * -1);

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			shapes[2][i].position = view.center.clone().add(p2);
			shapes[2][i].rotation = b.angle;

			const p3 = new Point (b.position.x, b.position.y * -1);
			shapes[3][i].position = view.center.clone().add(p3);
			shapes[3][i].rotation = (b.angle * -1);
		});
	}

	return { init, onResize, show, hide }
}

export default Kalidoscope;