import Kalidoscope from './kalidoscope';

const kickIt = () => {
	const k = Kalidoscope();
	k.init();
}


document.addEventListener('DOMContentLoaded', kickIt);