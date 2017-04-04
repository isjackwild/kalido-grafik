import { Events, Engine, World, Bodies, Body, Render, MouseConstraint, Mouse } from 'matter-js';
const paper = require('paper');
import Victor from 'victor';
paper.install(window);
import TweenMax from 'gsap';
import _ from 'lodash';

import { SHAPE_COUNT, WALL_RESTITUTION, BODY_RESTITUTION, BODY_FRICTION, BODY_AIR_FRICTION, WALL_THICKNESS, SHAPE_RADIUS, GRAVITY_STRENGTH, CLICK_STRENGTH } from './CONSTANTS.js';


const Kalidoscope = () => {
	let raf, i = 0, x = 0, then, now, tick = 0, delta = 1, isInit = false;
	let walls = [], bodies = [], shapes = [[],[], [], []];
	let engine;

	const canvas = document.getElementsByClassName('interactive-background')[0];
	paper.setup(canvas);

	project.currentStyle = {
		strokeColor: '#000000',
		fillColor: '#000000',
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
	}

	const init = () => {
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
		
		const len = Math.sqrt((window.innerWidth * window.innerWidth) + (window.innerHeight * window.innerHeight)) / 2 * 0.8;
		// const len = Math.min(window.innerWidth, window.innerHeight) * 0.5;

		for (let i = 0; i < SHAPE_COUNT; i++){
			const scale = (((len - SHAPE_RADIUS) / SHAPE_COUNT) * i) + SHAPE_RADIUS * 2;
			// console.log(scale);
			const pos = new Victor(-1, -1).normalize().rotateByDeg(Math.random() * 45 - 90).multiply(new Victor(scale * -1, scale * -1));
			if (pos.y < (window.innerHeight * -1) + SHAPE_RADIUS) pos.y = (window.innerHeight * -1) + SHAPE_RADIUS + 10;
			if (pos.x < (window.innerWidth * -1) + SHAPE_RADIUS) pos.x = (window.innerWidth * -1) + SHAPE_RADIUS + 10;
			console.log(pos);

			bodies.push(Bodies.circle(pos.x, pos.y, SHAPE_RADIUS, bodyOptions))
		}

		// bodies = [
		// 	Bodies.circle(window.innerWidth * -0.2, window.innerHeight * -0.20, SHAPE_RADIUS, bodyOptions),
		// 	Bodies.circle(window.innerWidth * -0.1, window.innerHeight * -0.1, SHAPE_RADIUS, bodyOptions),
		// 	Bodies.circle(window.innerWidth * -0.15, window.innerHeight * -0.3, SHAPE_RADIUS, bodyOptions),
		// 	// Bodies.rectangle(window.innerWidth * -0.2, window.innerHeight * -0.20, SHAPE_RADIUS, SHAPE_RADIUS, bodyOptions),
		// 	// Bodies.rectangle(window.innerWidth * -0.1, window.innerHeight * -0.1, SHAPE_RADIUS, SHAPE_RADIUS, bodyOptions),
		// 	// Bodies.rectangle(window.innerWidth * -0.15, window.innerHeight * -0.3, SHAPE_RADIUS, SHAPE_RADIUS, bodyOptions),
		// ];

		bodies.forEach(b => {
			const p0 = new Point (b.position.x, b.position.y);
			const pa0 = new Path.Circle(view.center.clone().add(p0), SHAPE_RADIUS);
			pa0.opacity = 0;
			shapes[0].push(pa0);

			const p1 = new Point (b.position.x * -1, b.position.y);
			const pa1 = new Path.Circle(view.center.clone().add(p1), SHAPE_RADIUS);
			pa1.opacity = 0;
			shapes[1].push(pa1);

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			const pa2 = new Path.Circle(view.center.clone().add(p2), SHAPE_RADIUS);
			pa2.opacity = 0;
			shapes[2].push(pa2);

			const p3 = new Point (b.position.x, b.position.y * -1);
			const pa3 = new Path.Circle(view.center.clone().add(p3), SHAPE_RADIUS);
			pa3.opacity = 0;
			shapes[3].push(pa3);
		});

		const allBodies = [...walls, ...bodies]
		now = new Date().getTime();
		tick = Math.random() * 5000;
		World.add(engine.world, allBodies);
		Engine.run(engine);
		Events.on(engine, 'afterUpdate', update);
		window.addEventListener('mousedown', onClick);
		window.addEventListener('touchstart', onClick);

		show();
		isInit = true;
	}

	const kill = () => {
		if (!isInit) return;
		isInit = false;
		Engine.clear(engine);
		Events.off(engine, 'afterUpdate', update);
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

	const onClick = (e) => {
		let x = e.touches ? e.touches[0].clientX : e.clientX - window.innerWidth * 0.5;
		let y = e.touches ? e.touches[0].clientY : e.clientY - window.innerHeight * 0.5;

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
	}

	const update = () => {
		if (then) delta = (now - then) / 16.666;
		then = now;
		now = new Date().getTime();
		tick += delta;

		engine.world.gravity.x = Math.cos(tick / 150) * GRAVITY_STRENGTH;
		engine.world.gravity.y = Math.cos(tick / 70) * GRAVITY_STRENGTH;

		bodies.forEach((b, i) => {
			const p0 = new Point (b.position.x, b.position.y);
			shapes[0][i].position = view.center.clone().add(p0);
			shapes[0][i].rotation = b.angle;

			const p1 = new Point (b.position.x * -1, b.position.y);
			shapes[1][i].position = view.center.clone().add(p1);
			shapes[1][i].rotation = b.angle * -1;

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			shapes[2][i].position = view.center.clone().add(p2);
			shapes[2][i].rotation = b.angle;

			const p3 = new Point (b.position.x, b.position.y * -1);
			shapes[3][i].position = view.center.clone().add(p3);
			shapes[3][i].rotation = b.angle * -1;
		});
	}

	return { init, onResize, show, hide }
}

export default Kalidoscope;