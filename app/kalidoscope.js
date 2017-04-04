import { Events, Engine, World, Bodies, Body, Render, MouseConstraint, Mouse } from 'matter-js';
const paper = require('paper');
import Victor from 'victor';
paper.install(window);

import { SHAPE_COUNT, WALL_RESTITUTION, BODY_RESTITUTION, WALL_THICKNESS, SHAPE_RADIUS, GRAVITY_STRENGTH } from './CONSTANTS.js';


const Kalidoscope = () => {
	let raf, i = 0, x = 0, then, now, tick = 0, delta = 1;
	let walls = [], bodies = [], shapes = [[],[], [], []];
	let engine = Engine.create();
	engine.world.gravity.x = -0.1;
	engine.world.gravity.y = -0.1;

	const canvas = document.getElementsByClassName('interactive-background')[0];
	paper.setup(canvas);

	project.currentStyle = {
		strokeColor: '#000000',
		fillColor: '#000000',
		strokeWidth: 0,
	};

	const init = () => {
		const wallOptions = {
			isStatic: true,
			restitution: WALL_RESTITUTION,
		}
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

		const bodyOptions = {
			restitution: BODY_RESTITUTION,
			friction: 0.02,
			frictionAir: 0.01,
			frictionStatic: 0,
		}

		bodies = [
			Bodies.circle(window.innerWidth * -0.2, window.innerHeight * -0.20, SHAPE_RADIUS, bodyOptions),
			Bodies.circle(window.innerWidth * -0.1, window.innerHeight * -0.1, SHAPE_RADIUS, bodyOptions),
			Bodies.circle(window.innerWidth * -0.15, window.innerHeight * -0.3, SHAPE_RADIUS, bodyOptions),
		];

		bodies.forEach(b => {
			const p0 = new Point (b.position.x, b.position.y);
			shapes[0].push(
				new Path.Circle(view.center.clone().add(p0), SHAPE_RADIUS)
			);

			const p1 = new Point (b.position.x * -1, b.position.y);
			shapes[1].push(
				new Path.Circle(view.center.clone().add(p1), SHAPE_RADIUS)
			);

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			shapes[2].push(
				new Path.Circle(view.center.clone().add(p2), SHAPE_RADIUS)
			);

			const p3 = new Point (b.position.x, b.position.y * -1);
			shapes[3].push(
				new Path.Circle(view.center.clone().add(p3), SHAPE_RADIUS)
			);
		});

		const allBodies = [...walls, ...bodies]
		now = new Date().getTime();
		World.add(engine.world, allBodies);
		Engine.run(engine);
		Events.on(engine, 'afterUpdate', update);
		window.addEventListener('mousedown', onClick);
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
			let scale = (1 - dist / Math.max(window.innerWidth * 0.5, window.innerHeight * 0.5)) * 0.1;

			const force = new Victor(
				b.position.x - mP.x,
				b.position.y - mP.y,
			).norm().multiply(new Victor(scale, scale));

			Body.applyForce(b, { x: mP.x, y: mP.y }, force);
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

			const p1 = new Point (b.position.x * -1, b.position.y);
			shapes[1][i].position = view.center.clone().add(p1);

			const p2 = new Point (b.position.x * -1, b.position.y * -1);
			shapes[2][i].position = view.center.clone().add(p2);

			const p3 = new Point (b.position.x, b.position.y * -1);
			shapes[3][i].position = view.center.clone().add(p3);
		});
	}

	return { init }
}

export default Kalidoscope;