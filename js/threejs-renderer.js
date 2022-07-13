//import * as THREE from './three.module.js';
//import * as THREE from './three.js';

import {
    Color,
    Scene,
    LinearInterpolant,
    PerspectiveCamera,
    BufferGeometry,
    Points,
    PointsMaterial,
    Float32BufferAttribute,
    WebGLRenderer,
    HemisphereLight
}
from './three.module.js';

class ThreeJSRenderer {

    constructor(canvas, video) {
        this.canvas = canvas;
        console.log("Canvas: ", this.canvas);
        this.video = video;
        console.log("Video:", this.video);

        console.log("setting up ThreeJSRenderer");

        this.gl = this.canvas.getContext("webgl");
        console.log("GL:", this.gl);

        this.mediaStream = this.video.srcObject;

        this.start = Date.now();

        this.init();
    }

    init() {
        this.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
        this.camera.position.x = 0;
        this.camera.position.z = 120;

        this.scene = new Scene();
        this.scene.background = new Color(0x050505);

        const light = new HemisphereLight();
        this.scene.add(light);
        
        
        // Create a point cloud
        const spacing = 1;

        console.log("Video: ", this.video);
        console.log(`canvas WxH: ${this.canvas.width}x${this.canvas.height}`);
        
        const startingX = - (64 * 0.5);
        const startingY = - (48 * 0.5);
        const endingX   = + (64 * 0.5);
        const endingY   = + (48 * 0.5);

        console.log(`Start: ${startingX}, ${startingY}. End: ${startingY}, ${endingY}`);

        const vertices = [];

        console.log("Creating points..");
        for (let x = startingX; x <= endingX; x+=spacing){
            for (let y = startingY; y <= endingY; y+=spacing){

                const z = 0;
                vertices.push(x, y, z);
            }
        }
        console.log(`Created ${vertices.length / 3} points..`);

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

        const material = new PointsMaterial({color: 0xffffff});
        const points = new Points(geometry, material);

        this.scene.add(points);

        // Render on top of the existing canvas
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        //document.body.appendChild(this.renderer.domElement);

    }

    render() {

        // TODO: Check if OffscreenCanvas can help here
        // Draw the video first on another canvas, then read its colors by accessing that canvas
        this.invisibleCanvas = document.createElement('canvas');
        this.invisibleCanvas.width = video.videoWidth;
        this.invisibleCanvas.height = video.videoHeight;
        this.ctx = this.invisibleCanvas.getContext('2d');

        this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
        const videoColors = this.ctx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;

        // TODO: Update the color of the points with the colors from the video

        //const time = Date.now() * 0.001;
        //console.log("rendering..");

        this.renderer.render(this.scene, this.camera);
    }
}

export {
    ThreeJSRenderer
}