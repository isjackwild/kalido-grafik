import Kalidoscope from './kalidoscope';
import _ from 'lodash';

let k;

const kickIt = () => {
	k = Kalidoscope();
	k.init();

	window.addEventListener('resize', _.debounce(onResize, 333));
}

const onResize = () => {
	k.onResize();
}

document.addEventListener('DOMContentLoaded', kickIt);