import { Events, Engine, World, Bodies, Body, Render, MouseConstraint, Mouse } from 'matter-js';
const paper = require('paper');
paper.install(window);

import { SHAPE_COUNT, WALL_RESTITUTION, BODY_RESTITUTION, WALL_THICKNESS, SHAPE_RADIUS } from './CONSTANTS.js';


const Kalidoscope = () => {
	let raf, i = 0, x = 0, then, now, delta = 1;
	let walls = [], bodies = [], shapes = [];
	let engine = Engine.create();
	engine.world.gravity.x = -0.1;
	engine.world.gravity.y = -0.1;

	const canvas = document.getElementsByClassName('interactive-background')[0];
	paper.setup(canvas);

	const init = () => {
		console.log('init');
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
				WALL_THICKNESS * -0.5,
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
			friction: 0,
			frictionAir: 0,
			frictionStatic: 0,
		}

		bodies = [
			Bodies.circle(window.innerWidth * -0.25, window.innerHeight * -0.25, SHAPE_RADIUS, bodyOptions)
		];

		const shape = new Path.Circle( new Point(window.innerWidth * 0.25, window.innerHeight * 0.25), SHAPE_RADIUS);
		shape.fillColor = '#000000';
		shapes = [
			[shape]
		];

		const allBodies = [...walls, ...bodies]
		World.add(engine.world, allBodies);
		Engine.run(engine);
		Events.on(engine, 'afterUpdate', update);
	}

	const update = () => {
		bodies.forEach((b, i) => {
			const bodyPoint = new Point (b.position.x, b.position.y);
			shapes[0][i].position = view.center.clone().add(bodyPoint);
		});
	}

	return { init }
}

export default Kalidoscope;