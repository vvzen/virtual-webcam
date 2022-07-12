//import * as THREE from './three.module.js';
//import * as THREE from './three.js';

import {
    Color,
    Scene,
    PerspectiveCamera,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    DoubleSide,
    Float32BufferAttribute,
    WebGLRenderer,
    HemisphereLight
}
from './three.module.js';

class ThreeJSRenderer {

    constructor(canvas, video) {
        this.canvas = canvas;
        this.video = video;

        console.log("setting up ThreeJSRenderer");
        console.log("canvas: ", this.canvas);
        this.gl = this.canvas.getContext("webgl");
        this.mediaStream = this.video.srcObject;

        console.log("Video:", this.video);
        console.log("GL:", this.gl);

        this.start = Date.now();

        this.init();
    }

    init() {
        this.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
        this.camera.position.z = 64;

        this.scene = new Scene();
        this.scene.background = new Color(0x050505);

        const light = new HemisphereLight();
        this.scene.add(light);

        //

        const geometry = new BufferGeometry();

        const indices = [];

        const vertices = [];
        const normals = [];
        const colors = [];

        const size = 20;
        const segments = 10;

        const halfSize = size / 2;
        const segmentSize = size / segments;

        // generate vertices, normals and color data for a simple grid geometry

        for (let i = 0; i <= segments; i++) {

            const y = (i * segmentSize) - halfSize;

            for (let j = 0; j <= segments; j++) {

                const x = (j * segmentSize) - halfSize;

                vertices.push(x, -y, 0);
                normals.push(0, 0, 1);

                const r = (x / size) + 0.5;
                const g = (y / size) + 0.5;

                colors.push(r, g, 1);
            }
        }

        // generate indices (data for element array buffer)

        for (let i = 0; i < segments; i++) {

            for (let j = 0; j < segments; j++) {

                const a = i * (segments + 1) + (j + 1);
                const b = i * (segments + 1) + j;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + (j + 1);

                // generate two faces (triangles) per iteration

                indices.push(a, b, d); // face one
                indices.push(b, c, d); // face two
            }
        }

        //

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

        const material = new MeshPhongMaterial({
            side: DoubleSide,
            vertexColors: true
        });

        this.mesh = new Mesh(geometry, material);
        this.scene.add(this.mesh);

        //

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

        const time = Date.now() * 0.001;
        //console.log("rendering..");

        this.mesh.rotation.x = time * 0.25;
        this.mesh.rotation.y = time * 0.5;

        this.renderer.render(this.scene, this.camera);
    }
}

export {
    ThreeJSRenderer
}