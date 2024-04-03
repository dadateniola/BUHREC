const body = document.body;
const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);
const selectWith = (p, e) => p.querySelector(e);
const selectAllWith = (p, e) => p.querySelectorAll(e);
const create = (e) => document.createElement(e);
const root = (e) => getComputedStyle(select(":root")).getPropertyValue(e);
const getStyle = (e, style) => window.getComputedStyle(e)[style];

gsap.registerPlugin(ScrollTrigger);

// Slider parameters {
//     slider: Element to hold the slider
//     motion: The level of counter movement between the slides children
//     gap: Space between the slides
//     delay: time before each animation starts
//     duration: time for each animation
// }
class Slider {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    conditions() {
        if (!this?.gap) this.gap = 0;
        if (!this?.motion) this.motion = 30;
        if (!this?.delay) this.delay = 0.8;
        if (!this?.duration) this.duration = 4;

        if (!this?.slider) return false;

        this.amount = 0;
        this.toFixed = 3;

        if (this.slider instanceof HTMLElement) {
            this.slides = selectAllWith(this.slider, "*");
            this.amount = this.slides.length + 1;

            return true;
        } else return false;
    }

    init() {
        if (!this.conditions()) return console.log("Basic slider conditions not met");

        this.setupSlides();

        this.imagesLoaded = 0;
        this.images = selectAll(".slider img");
        this.images.forEach(image => {
            if (image.complete) {
                this.checkLoadedImages();
            } else {
                image.onload = () => this.checkLoadedImages();
            }
        })
    }

    //Slider methods
    setupSlides() {
        //Don't edit the code under this function
        this.fullWidth = 100 * this.amount;
        this.slideWidth = parseFloat((100 / this.amount).toFixed(this.toFixed));

        Slider.insertToDOM({
            type: "div",
            parent: this.slider,
            classes: 'slider',
            properties: { width: `calc(${this.fullWidth}% + ${this.gap * this.amount}px)` }
        });

        this.slides.forEach((elem, i) => {
            Slider.insertToDOM({
                type: "div",
                append: elem.cloneNode(true),
                parent: select(".slider"),
                classes: (i == 0) ? ['slide', 'active'] : 'slide',
                properties: { width: `calc(${this.slideWidth}% - ${this.gap}px)`, marginLeft: (i > 0) ? `${this.gap}px` : 0 }
            });

            elem.remove();
        })

        //Replicate the first slide after the last slide
        Slider.insertToDOM({
            type: "div",
            append: this.slides[0].cloneNode(true),
            parent: select(".slider"),
            classes: ['slide', 'end'],
            properties: { width: `calc(${this.slideWidth}% - ${this.gap}px)`, marginLeft: `${this.gap}px` }
        });
    }

    animate() {
        const tl = gsap.timeline({ defaults: { duration: this.duration, ease: "Expo.easeInOut" } });

        const activeSlide = select(".slide.active");
        const activeImg = selectWith(activeSlide, "*");
        const nextSlide = activeSlide?.nextElementSibling;
        const nextImg = selectWith(nextSlide, "*");

        const slider = select(".slider");
        const width = parseFloat(slider.dataset?.width) || this.slideWidth;

        tl
            .set(nextImg, { xPercent: -this.motion })
            .to(slider, { xPercent: -width, delay: this?.delay })
            .to(activeImg, { xPercent: this.motion, clearProps: "transform" }, "<")
            .to(nextImg, { xPercent: 0 }, "<")
            .call(() => {
                if (nextSlide.classList.contains("end")) {
                    gsap.set(slider, { xPercent: 0 });

                    slider.dataset.width = this.slideWidth;
                    activeSlide.classList?.remove("active");
                    selectAll(".slide")[0].classList.add("active");
                } else {
                    slider.dataset.width = (width + this.slideWidth).toFixed(this.toFixed);

                    activeSlide.classList?.remove("active");
                    nextSlide.classList?.add("active");
                }

                this.animate();
            });
    }

    checkLoadedImages() {
        this.imagesLoaded++;
        if (this.imagesLoaded === this.images.length) {
            console.log("All images loaded");

            gsap.to(".slider", {
                opacity: 1, delay: 1, onComplete: () => {
                    select("main").classList.add("stop");
                    this.animate();
                }
            });
        }
    }

    //Static Methods
    static insertToDOM(params = {}) {
        const { type, text, append, parent, before, classes, properties } = params;

        if (!type || !parent) return null;

        //Insert element contents
        const element = create(type);

        if (text) {
            if (type == "img") element.src = text;
            else element.innerHTML = text;
        }

        //Append an HTML element instead of a text
        if (append) {
            element.appendChild(append);
        }

        //Add classes
        if (classes?.length) {
            if (Array.isArray(classes)) classes.forEach(c => element.classList.add(c));
            else element.classList.add(classes);
        }

        //Change properties
        if (properties) {
            if (Slider.isObject(properties)) {
                for (const property in properties) {
                    element.style[property] = properties[property];
                }
            }
        }

        //Append element to parent
        if (before) parent.insertBefore(element, before);
        else parent.appendChild(element);

        return element;
    }

    static isObject(value) {
        return (typeof value === 'object' && value !== null && !Array.isArray(value));
    }
}

class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    static preventDefault = (event) => event.preventDefault();
    static disableLinksAndBtns = (condition = false, parent = undefined) => {
        const elements = parent ? selectAllWith(parent, "a, button") : selectAll('a, button');
        elements.forEach((element) => {
            if (condition) {
                element.setAttribute('disabled', 'true');

                if (element.tagName === 'A') {
                    element.dataset.href = element.href;
                    element.addEventListener('click', Methods.preventDefault);
                }
            } else {
                selectAll('a, button').forEach((element) => {
                    element.removeAttribute('disabled');

                    if (element.tagName === 'A') {
                        element.setAttribute('href', element.dataset.href);
                        element.removeEventListener('click', Methods.preventDefault);
                    }
                });
            }
        });
    }

    static formDataToJson = (formData) => {
        const entries = formData.entries();
        const dataObj = Array.from(entries).reduce((data, [key, value]) => {
            data[key] = value;
            return data;
        }, {});

        return JSON.stringify(dataObj);
    }

    static checkDeviceType = () => {
        const mobileThreshold = 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (isTouchDevice && screenWidth <= mobileThreshold) {
            return "mobile";
        } else {
            return "pc";
        }
    }

    static insertToDOM(params = {}) {
        // insertToDOM parameters {
        //     type: Element type
        //     text: innetHTML to be put in the element
        //     append: HTML element to be appended in case we aint using text
        //     parent: Element to hold the created element
        //     before: Element to place the created element before among the children of the parent
        //     classes: Classes of the element being created, can be array or String
        //     properties: CSS properties to be applied to the element, must be an object
        //     attributes: Attributes of the element being created, can be array or String
        // }

        const { type, text, append, parent, before, classes, properties, attributes, no_data } = params;

        if (!type) return null;

        //Insert element contents
        const element = create(type);

        if (text) {
            if (type == "img") element.src = text;
            else element.innerHTML = text;
        }

        //Append an HTML element instead of a text
        if (append) {
            element.appendChild(append);
        }

        //Add classes
        if (classes?.length) {
            if (Array.isArray(classes)) classes.forEach(c => element.classList.add(c));
            else element.classList.add(classes);
        }

        //Change properties
        if (properties) {
            if (Methods.isObject(properties)) {
                for (const property in properties) {
                    element.style[property] = properties[property];
                }
            }
        }

        if (attributes?.length) {
            if (Array.isArray(attributes)) attributes.forEach(([a, v]) => element.setAttribute(`${no_data ? '' : 'data-'}${a}`, v || ''));
            else element.setAttribute(`${no_data ? '' : 'data-'}${attributes}`, '');
        }

        //Append element to parent
        if (parent) {
            if (before) parent.insertBefore(element, before);
            else parent.appendChild(element);
        }

        return element;
    }

    static isObject(value) {
        return (typeof value === 'object' && value !== null && !Array.isArray(value));
    }

    static isEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }

    static sentenceCase(str = '') {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static assignErrorMsgs(data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = select(`[name=${key}]`);
            const parent = input.parentNode;

            Methods.removeErrorMsgs(input);

            Methods.insertToDOM({
                type: 'span',
                text: this.sentenceCase(value),
                parent,
                classes: 'error'
            })

            input.classList.add('error');
            input.addEventListener("focus", Methods.removeErrorMsgs)
        })
    }

    static removeErrorMsgs(e) {
        const input = e instanceof Event ? e.target : e;
        const nextSibling = input.nextElementSibling;

        if (nextSibling && nextSibling.tagName === 'SPAN' && nextSibling.classList.contains('error')) nextSibling.remove();

        input.classList.remove('error');
        input.removeEventListener("focus", Methods.removeErrorMsgs);
    }
}

class CommonSetup {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
        return this;
    }

    init() {
        // Change this later
        const info = select(".alert-box [data-info]");
        if (info) {
            const type = selectWith(info, "#type").innerHTML;
            const message = selectWith(info, "#message").innerHTML;

            info.remove();
            select(".alert-box").removeAttribute("data-disabled")

            new Alert({ type, message })
        }

        select(`a[href='${window.location.pathname}']`)?.classList.add("highlight");

        select("input[type='file']")?.addEventListener('change', CommonSetup.handleFileSelect);
    }

    //Attach spinner to elements
    static attachSpinner(params = {}) {
        const { elem } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('Conditions not met to "attachSpinner"');

        const spinner = selectWith(elem, ".spinner");

        if (spinner) return;

        const width = elem.clientWidth + 3;
        const height = elem.clientHeight + 3;

        // console.log(width, height);

        elem.style.width = `${width}px`;
        elem.style.height = `${height}px`;

        if (elem.children.length) elem.classList.add("none")
        else {
            elem.dataset.innerText = elem.innerText;
            elem.innerText = '';
        }

        Methods.insertToDOM({
            type: 'div',
            parent: elem,
            append: Methods.insertToDOM({
                type: 'span',
                attributes: 'spinner'
            }),
            classes: 'spinner'
        })
    }

    static detachSpinner(params = {}) {
        const { elem } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('Conditions not met to "detachSpinner"');

        setTimeout(() => {
            const spinner = selectWith(elem, ".spinner");

            if (!spinner) return;

            spinner.remove();

            if (elem.children.length) elem.classList.remove("none")
            else {
                elem.innerText = elem.dataset?.innerText;
                elem.removeAttribute("data-innerText");
            }
        }, 300);
    }

    //FIle select
    static handleFileSelect(event) {
        const input = event.target;
        const file = input.files[0];

        CommonSetup.uploadFile({ file, input });

        // if (file && file.type === 'application/pdf') {
        //     CommonSetup.uploadFile({ file, input });
        // } else {
        //     new Alert({ message: 'Please select a valid PDF file', type: 'warning' });
        //     CommonSetup.resetFileInput(input);
        // }
    }

    static uploadFile(params = {}) {
        const { file, input } = params;
        const uploadBox = select("#upload-box");

        if (!file || !input) {
            new Alert({
                message: 'Something went wrong, please try again',
                type: 'warning'
            });
            return console.warn("Both a file and its input are required to 'uploadFile'");
        }

        const upload = CommonSetup.attachUpload({ file });
        const bar = selectWith(upload, ".upload-progress-box");

        gsap.to(upload, { x: 0, opacity: 1, ease: 'Back.easeOut' });

        const formData = new FormData();
        formData.append('pdfFile', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const complete = ((event.loaded / event.total) * 360).toFixed(1);
                bar.style.background = `conic-gradient(var(--malachite) ${complete}deg, var(--errie-black) 0deg)`;
            }
        });

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText)
                    displayPreview(data.filename);
                    new Alert({ message: 'File upload complete', type: 'success' });

                    gsap.to(upload, {
                        delay: 0.8,
                        y: '100%',
                        opacity: 0,
                        ease: 'Expo.easeIn',
                        onComplete: () => {
                            CommonSetup.resetFileInput(input, upload);
                        }
                    });
                } else if (xhr.status === 0) {
                    console.log('Upload cancelled by user');
                } else {
                    const data = JSON.parse(xhr.responseText)
                    new Alert(data);

                    gsap.to(upload, {
                        delay: 0.8,
                        y: '100%',
                        opacity: 0,
                        ease: 'Expo.easeIn',
                        onComplete: () => {
                            CommonSetup.resetFileInput(input, upload);
                        }
                    });
                }
            }
        }

        function displayPreview(filename = '') {
            const parent = select(`label[data-preview="${input.name}"]`);

            if (!(parent instanceof HTMLElement)) return console.warn('A parent is required to "displayPreview"');

            selectWith(parent, 'iframe')?.remove();

            if (parent.children.length) parent.classList.add("none");

            Methods.insertToDOM({
                type: 'iframe',
                parent,
                attributes: [
                    ['src', `/get-pdf/${filename}/preview`],
                    ['width', '100%'],
                    ['height', '100%']
                ],
                no_data: true
            })
        }

        xhr.open('POST', '/upload', true);
        xhr.send(formData);
    }

    static attachUpload(params = {}) {
        const { file } = params;

        if (!file) return console.warn("Couldn't 'attachUpload', file not found");

        const name = file.name.split(".").slice(0, -1).join('.');
        const ext = file.name.split(".").pop();
        const size = ((file.size / 1024) / 1024).toFixed(2) + 'MB';

        const html = `
            <div class="upload-progress-box">
                <div class="upload-progress-cont">
                    <img src="/images/icons/watch.png" alt="icon">
                </div>
            </div>
            <div class="upload-progress-text">
                <div class="upload-name">
                    <p data-upload-name>${name}</p>
                    <p data-upload-ext>.${ext}</p>
                </div>
                <p class="sub"><span data-upload-done>0.0 MB</span> / <span data-upload-size>${size}</span></p>
            </div>
        `;

        const upload = Methods.insertToDOM({
            type: 'div',
            parent: select("#upload-box"),
            text: html,
            classes: 'upload',
            properties: {
                transform: 'translateX(-100%)',
                opacity: 0
            }
        })

        return upload;
    }

    static resetFileInput(input, upload, parent) {
        if (input) {
            input.value = '';
        }

        upload.remove();

        if (parent) {
            selectWith(parent, 'iframe')?.remove();
            parent.classList.remove("none");
        }
    }
}

class Alert {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    init() {
        Methods.disableLinksAndBtns(true);

        if (!this?.type && !this?.message) return console.warn("Conditions weren't met for Alert");

        const html = `
            <div class="alert-progress"></div>
            <div class="alert-icon">
                <img src="/images/icons/${this.type}.png" alt="icon">
            </div>
            <div class="alert-text">
                <h1>${this.type}</h1>
                <p>${this.message}</p>
            </div>`;

        const newAlert = Methods.insertToDOM({
            type: 'div',
            text: html,
            parent: select(".alert-box"),
            classes: 'alert',
            attributes: this.type,
            properties: { opacity: 0 }
        })
        const prevAlert = newAlert.previousElementSibling;

        this.openAlert(newAlert);

        if (prevAlert) Alert.closeAlert(prevAlert);
        Methods.disableLinksAndBtns();
    }

    openAlert(alert) {
        if (!alert instanceof HTMLElement) return;

        const alertTime = 5;
        const tl = gsap.timeline();

        tl
            .set(alert, { xPercent: 120 })
            .to(alert, { xPercent: 0, opacity: 1, ease: 'back.out(1.7)', })
            .to(selectWith(alert, ".alert-progress"), { duration: alertTime, width: '100%', ease: 'none', onComplete: () => Alert.closeAlert(alert) })
    }

    static closeAlert(alert) {
        if (!alert instanceof HTMLElement) return;

        gsap.to(alert, { x: -80, opacity: 0, delay: 0.5, ease: "expo.out", onComplete: () => alert.remove() })
    }
}

new CommonSetup();