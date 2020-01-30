import { Events, Engine, World, Bodies, Body, Render, MouseConstraint, Mouse } from 'matter-js';
const paper = require('paper');
import Victor from 'victor';
paper.install(window);
import 'gsap';
import _ from 'lodash';
import { hexToRgb, rgbToHex } from './lib/colour.js';

import {
	SHAPE_COUNT,
	SHAPE_COUNT_MOB,
	WALL_RESTITUTION,
	BODY_RESTITUTION,
	BODY_FRICTION,
	BODY_AIR_FRICTION,
	BODY_BASE_MASS,
	BODY_RAND_MASS,
	BODY_COLLISSION_FORCE,
	BODY_COLLISSION_FORCE_SMALL,
	WALL_THICKNESS,
	SHAPE_RADIUS,
	GRAVITY_STRENGTH,
	OWN_GRAVITY_STRENGTH,
	CLICK_STRENGTH,
	EXAMPLE_SVG,
	MAX_VELOCITY,
	MAX_ANGULAR_VELOCITY,
	COLOUR_CHANGE_SPEED,
} from './CONSTANTS.js';

let customSVG;

function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

const Kalidoscope = () => {
	let raf, i = 0, x = 0, then, now, tick = 0, delta = 1, isInit = false;
	let walls = [], bodies = [], shapes = [[],[], [], []], collissions = [];
	let engine;
	let colorTl, currentColor;

	const canvas = document.getElementsByClassName('interactive-background')[0];
	paper.setup(canvas);

	let colors = canvas.dataset.colors ? canvas.dataset.colors.split(',') : null;
	colors.pop();
	shuffle(colors);
	

	let bodyCollissionForce = (window.innerWidth <= 375) ? BODY_COLLISSION_FORCE_SMALL : BODY_COLLISSION_FORCE;

	const customSvgWrapper = document.getElementsByClassName('interactive-background__custom-svg')[0];
	const customSVG = customSvgWrapper.getElementsByTagName('svg')[0];

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
		let shape_radius;
		if (window.innerWidth <= 414) {
			shape_radius = canvas.dataset.shapeRadiusMob ? (parseInt(canvas.dataset.shapeRadiusMob) || SHAPE_RADIUS) : SHAPE_RADIUS; 
		} else {
			shape_radius = canvas.dataset.shapeRadius ? (parseInt(canvas.dataset.shapeRadius) || SHAPE_RADIUS) : SHAPE_RADIUS; 
		}
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
		walls[0].hitForce = new Victor(0, 1);
		walls[1].hitForce = new Victor(0, -1);
		walls[2].hitForce = new Victor(1, 0);
		walls[3].hitForce = new Victor(-1, 0);
		walls.forEach(w => w.label = 'wall');
		
		const len = Math.sqrt((window.innerWidth * window.innerWidth) + (window.innerHeight * window.innerHeight)) / 2 * 0.8;
		const shapeCount = (()=> {
			return 3 // delete this line when you want to revert to it being dependent on screen size / ie. NOT the EU flag!
			if (window.innerWidth <= 667 && window.innerWidth > window.innerHeight) return 1;
			if (window.innerWidth <= 375) return 1;
			if (window.innerWidth <= 1024) return 3;
			return 4; 
		})();

		for (let i = 0; i < shapeCount; i++){
			const scale = (((len - shape_radius) / shapeCount) * i) + shape_radius * 2;
			const pos = new Victor(-1, -1).normalize().rotateByDeg(45).multiply(new Victor(scale * -1, scale * -1));
			if (pos.y < (window.innerHeight * -1) + shape_radius) pos.y = (window.innerHeight * -1) + shape_radius + 10;
			if (pos.x < (window.innerWidth * -1) + shape_radius) pos.x = (window.innerWidth * -1) + shape_radius + 10;

			const yScale = (i+0.5) / (shapeCount + 1);
			const maxSpreadY = (window.innerHeight * 0.5) - (shape_radius * 2);
			const maxSpreadX = (window.innerWidth * 0.5) - (shape_radius * 2);
			pos.y = -1 * yScale * (window.innerHeight / 2) - shape_radius * 0.5;
			pos.x = -1 * (Math.random() * maxSpreadX) - shape_radius;

			const b = Bodies.circle(pos.x, pos.y, shape_radius, bodyOptions);
			b.velocity = new Victor(0, 0);
			b.position = new Victor(pos.x, pos.y);
			b.label = 'shape';
			b.gravity = { x: 0, y: 0 };
			b.gravitySpeed = { x: Math.random() * 0.008 + 0.005, y: Math.random() * 0.008 + 0.005 };
			Body.setMass(b, Math.random() * BODY_RAND_MASS + BODY_BASE_MASS)

			bodies.push(b)
		}

		const generatePath = (p, s) => {
			if (!customSVG) return new Path.Circle(view.center.clone().add(p), shape_radius);
			const svg = project.importSVG(customSVG);
			svg.strokeWidth = 0;
			svg.bounds.width = shape_radius * 1.8;
			svg.bounds.height = shape_radius * 1.8;
			svg.scale(s.x, s.y);
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

		if (colors && colors.length) {
			colorTl = new TimelineLite({ onComplete: () => colorTl.restart() });
			colors.forEach(c => {
				colorTl.to(currentColor, COLOUR_CHANGE_SPEED, {...hexToRgb(c), ease: Power0.easeNone, onUpdate: updateColor });
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
		bodyCollissionForce = (window.innerWidth <= 375) ? BODY_COLLISSION_FORCE_SMALL : BODY_COLLISSION_FORCE;
		kill();
		requestAnimationFrame(() => {
			init();
		});
	}

	const show = () => {
		shapes.forEach(s => TweenMax.staggerTo(s, 0.33, { opacity: 1, ease: Sine.easeInOut }, 0.15));
	}

	const hide = () => {
		shapes.forEach(s => TweenMax.staggerTo(s, 0.33, { opacity: 0, ease: Sine.easeInOut }, 0.15));
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
			if (p.bodyA.label === 'wall') {
				Body.applyForce(
					p.bodyB,
					p.bodyB.position.clone().subtract(p.bodyA.hitForce),
					p.bodyA.hitForce.clone().multiply(new Victor(bodyCollissionForce, bodyCollissionForce))
				);
			} else if (p.bodyB.label === 'wall') {
				Body.applyForce(
					p.bodyA,
					p.bodyA.position.clone().subtract(p.bodyB.hitForce),
					p.bodyB.hitForce.clone().multiply(new Victor(bodyCollissionForce, bodyCollissionForce))
				);
			} else {
				const forceA = new Victor(
					p.bodyA.position.x - p.bodyB.position.x,
					p.bodyA.position.y - p.bodyB.position.y,
				).norm().multiply(new Victor(bodyCollissionForce, bodyCollissionForce));
				Body.applyForce(p.bodyA, p.bodyB.position, forceA);

				const forceB = new Victor(
					p.bodyB.position.x - p.bodyA.position.x,
					p.bodyB.position.y - p.bodyA.position.y,
				).norm().multiply(new Victor(bodyCollissionForce, bodyCollissionForce));
				Body.applyForce(p.bodyB, p.bodyA.position, forceB);
			}

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

		engine.world.gravity.x = Math.cos(tick * 0.006) * GRAVITY_STRENGTH;
		engine.world.gravity.y = Math.cos(tick * 0.01) * GRAVITY_STRENGTH;

		bodies.forEach((b, i) => {
			
			b.gravity.x = Math.cos((tick + (i * 123)) * b.gravitySpeed.x) * OWN_GRAVITY_STRENGTH;
			b.gravity.y = Math.cos((tick + (i * 123)) * b.gravitySpeed.y) * OWN_GRAVITY_STRENGTH;
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