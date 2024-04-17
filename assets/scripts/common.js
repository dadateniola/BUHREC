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

    static formatDate(date = '') {
        return date?.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
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

        select("#pdfFile[type='file']")?.addEventListener('change', CommonSetup.handleFileSelect);
        select("#chatFiles[type='file']")?.addEventListener('change', CommonSetup.handleChatFiles);

        select("[data-task-certify]")?.addEventListener("click", CommonSetup.certifyProposal)

        this.initializeForms();
        CommonSetup.initializeTriggers();
    }

    static initializeTriggers() {
        selectAll("[data-close]").forEach(elem => elem.removeEventListener("click", CommonSetup.closeOverlay));
        selectAll("[data-trigger]").forEach(elem => elem.removeEventListener("click", CommonSetup.handleTrigger));

        //-----------------------------------------------------

        selectAll("[data-close]").forEach(elem => elem.addEventListener("click", CommonSetup.closeOverlay));
        selectAll("[data-trigger]").forEach(elem => elem.addEventListener("click", CommonSetup.handleTrigger));
    }

    //Trigger overlay
    static handleTrigger() {
        const elem = this;
        const trigger = elem.getAttribute("data-trigger");
        const identifier = elem.getAttribute("data-identifier");

        if (trigger == 'task') CommonSetup.handleTaskTrigger(identifier);

        CommonSetup.triggerOverlay(trigger);
    }

    static async handleTaskTrigger(id) {
        if (!id) {
            new Alert({ message: "Missing identifier for proposal retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        select("[data-accept]").setAttribute("data-identifier", id);
        select("[data-accept]").addEventListener("click", CommonSetup.acceptProposal);
        select("#chatFiles[type='file']").setAttribute("data-identifier", id);
        select("[data-task-certify]").setAttribute("data-identifier", id);
        select("#task_id[type='hidden']").value = id;

        try {
            const initTasks = new Items({ table: 'tasks', id })
            const [task] = await initTasks.find();

            const initUsers = new Items({ table: 'users', userId: true })
            const [user] = await initUsers.find();

            const initOwner = new Items({ table: 'users', id: task.user_id })
            const [owner] = await initOwner.find();

            const initReviewer = new Items({ table: 'users', id: task.reviewer_id })
            const [reviewer] = await initReviewer.find();

            const initActivities = new Items({ table: 'activities', task_id: task.id })
            const activities = await initActivities.find();

            const initAttachments = new Items({ table: 'activities', task_id: task.id, type: 'file' })
            const attachments = await initAttachments.find();

            const initAllUsers = new Items({ custom: `SELECT * FROM users WHERE id IN (SELECT user_id FROM activities WHERE task_id = ${task.id})` })
            const allUsers = await initAllUsers.find();

            task.parent = select("#task");
            task.attach_length = attachments.length;
            task.reviewer = task.reviewer_id ? reviewer.fullname : '';
            CommonSetup.addData(task);

            CommonSetup.showOwner({ owner, user });
            CommonSetup.showReviewer(task.reviewer_id, { user, owner, task, reviewer });
            CommonSetup.showActivities({ activities, allUsers });
            CommonSetup.showAttachments({ attachments });
            CommonSetup.isComplete(task.status == 'complete');

            CommonSetup.initializeTriggers();
            select("[data-task-view-certificate]").setAttribute("href", task.certificate ? `/get-pdf/${task.certificate}/certificate` : '');
        } catch (error) {
            console.error('Error in handleTaskTrigger:', error);
            new Alert({ message: "Error retrieving resource information, please try again", type: 'error' });
        }
    }

    static addData(data = {}) {
        const parent = (data?.parent instanceof HTMLElement) ? data.parent : null;

        if (parent) {
            delete data.parent;

            selectAllWith(parent, "[data-delete]").forEach(e => e.remove());

            for (const [key, value] of Object.entries(data)) {
                const elem = selectWith(parent, `[data-task-${key}]`);

                if (!elem) continue;

                elem.innerText = value;
                elem.setAttribute("data-task-inserted", "");
            }
        } else console.warn("No parent found");
    }

    static showOwner(data = {}) {
        const { owner, user } = data;

        const parent = select("#task-owner");
        const text = `
            <img src="/images/avatars/${owner.pfp}" alt="pfp">
            <div class="pfp-text">
                ${(owner.id == user.id) ?
                `<p class="glow">${owner.fullname} (you)</p>` :
                `<p>${owner.fullname}</p>`
            }
                <span>${owner.email}</span>
            </div>
        `;
        Methods.insertToDOM({
            type: 'div',
            parent,
            text,
            classes: 'pfp-img',
            attributes: [['delete', '']]
        })
    }

    static showReviewer(condition = undefined, data = {}) {
        if (condition === undefined) return console.warn("No condition to show reviewer");

        const { user, owner, task, reviewer } = data;
        const deadlne = select("[data-task-deadline]");
        const chatBox = select("#chat-box");
        const chatCTA = select("#chat-cta");
        const chatClose = select("#chat-close");
        const certify = select("#certify");
        const parent = select("#reviewer-box");
        var text = '';
        var classes = '';

        if (condition) {
            text = `
                <div class="chat-profile-img">
                    <img src="/images/avatars/${reviewer.pfp}" alt="img">
                </div>
                <div class="chat-profile-text">
                    <h1>${reviewer.fullname}</h1>
                    <p>${reviewer.email}</p>
                </div>
                <div class="profile-row">
                    <button data-close>close</button>
                    <a href="">View profile</a>
                </div>
            `;
            classes = 'chat-profile-cont';
        } else {
            text = `
                <div class="pend"></div>
                <div class="pend"></div>
                <div class="pend"></div>
            `;
            classes = 'pending-icon';
        }

        Methods.insertToDOM({
            type: 'div',
            parent,
            text,
            classes,
            attributes: [['delete', '']]
        });

        const isOwnTask = user.id == owner.id;
        const isReviewer = user.id == task.reviewer_id;
        const isNotStudent = user.role != "student;"

        if (!condition) {
            //Hide chatbox if task doesnt have reviewer
            chatBox.classList.add("hidden");

            if (isOwnTask) {
                chatCTA.classList.add("hidden");
                chatClose.classList.remove("hidden");
            } else if (isNotStudent) chatCTA.classList.remove("hidden");
        } else {
            if (isReviewer || isOwnTask) {
                chatBox.classList.remove("hidden");
                if (isReviewer) certify.classList.remove("hidden");
            } else if (isNotStudent) {
                chatBox.classList.add("hidden");
                chatCTA.classList.add("hidden");
                chatClose.classList.remove("hidden");
            }

            const formattedDate = task.created;
            const parsedDate = new Date(formattedDate);
            parsedDate.setMonth(parsedDate.getMonth() + 6);

            deadlne.innerHTML = Methods.formatDate(parsedDate);
            deadlne.setAttribute("data-task-inserted", "");
        }
    }

    static showActivities(data = {}) {
        const { activities, allUsers } = data;
        const messageBox = select("#message-box");

        selectAllWith(messageBox, '[data-delete]')?.forEach(elem => elem.remove());

        activities.forEach(activity => {
            const user_info = allUsers.find(user => user.id == activity.user_id);
            const message = {
                name: user_info.fullname,
                pfp: user_info.pfp,
                type: activity.type,
                title: activity.title,
                content: activity.content,
                created: activity.created
            }
            CommonSetup.attachActivity(message);
        })

        messageBox.scrollTop = messageBox.scrollHeight;
    }

    static attachActivity(message = {}) {
        const { type, content, name, title, created, pfp, get } = message;
        const messageBox = select("#message-box");

        if (!type) return console.warn("No message type");

        const filename = content.split(".").slice(0, -1).join(".");
        const ext = content.split(".").pop();
        const html = {
            file: `
                <a href="/get-pdf/${content}" target="_blank" class="attachment">
                    <div class="attachment-icon">
                        <img src="/images/icons/file-regular.png" alt="icon">
                    </div>
                    <div class="attachment-text">
                        <div class="attachment-name">
                            <p class="attachment-name-para">${filename}</p>
                            <p class="no-cap">.${ext}</p>
                        </div>
                        <div class="attachment-info">
                            <p class="sub">0.00 MB</p>
                            <span class="glow view"></span>
                            <span class="glow">Click to view</span>
                        </div>
                    </div>
                </a>
            `,
            text: `
                <div class="message-body-text">
                    <p>${Methods.sentenceCase(content)}</p>
                </div>
            `,
            head: get ? '' : `
                <div class="pfp-img">
                    <img src="/images/avatars/${pfp}" alt="pfp">
                    <div class="pfp-text">
                        <p>${name}</p>
                        <span>${title}</span>
                    </div>
                </div>
                <div class="message-time">
                    <span>${created}</span>
                </div>
            `
        }

        const parent = Methods.insertToDOM({
            type: 'div',
            classes: 'message-cont',
            attributes: [['delete', '']]
        })

        const head = Methods.insertToDOM({
            type: 'div',
            parent,
            text: html.head,
            classes: 'message-head'
        })

        const body = Methods.insertToDOM({
            type: 'div',
            parent,
            text: html[type],
            classes: 'message-body'
        })

        if (get) {
            if (get == 'head') return head;
            if (get == 'body') return body;
        } else messageBox.append(parent);
    }

    static showAttachments(params = {}) {
        const { attachments } = params;
        const attachmentBox = select("#attachments-box");

        select("[data-task-attach_length]").innerHTML = attachments.length;
        selectAllWith(attachmentBox, '[data-delete]')?.forEach(elem => elem.remove());

        attachments.forEach(attach => {
            attach.type = 'file';
            attach.get = 'body';
            const attachment = CommonSetup.attachActivity(attach);
            attachment.setAttribute("data-delete", '');
            attachmentBox.append(attachment)
        })
    }

    static isComplete(condition) {
        const certify = select("#certify");
        const certified = select("#certified");
        const chatBox = select("#chat-box");
        const chatClose = select("#chat-close");

        if (condition) {
            certify.classList.add("hidden");
            certified.classList.remove("hidden");

            chatBox.classList.add("hidden");
            chatClose.classList.remove("hidden");
        }
    }

    static clearTriggered() {
        select("#chat-box").classList.add("hidden");
        select("#chat-cta").classList.add("hidden");
        select("#chat-close").classList.add("hidden");
        select("#certify").classList.add("hidden");
        select("#certified").classList.add("hidden");

        selectAll("[data-task-inserted]").forEach(elem => {
            elem.innerHTML = '-';
            elem.removeAttribute('data-task-inserted');
        });

        selectAll('[data-delete]').forEach(elem => elem.remove());

        select("[data-accept]").removeAttribute("data-identifier");
        select("[data-accept]").removeEventListener("click", CommonSetup.acceptProposal);
    }

    static triggerOverlay(trigger) {
        const overlay = select(`#${trigger}`);
        const children = overlay.children;
        const tl = gsap.timeline();

        tl
            .set(overlay, { opacity: 0 })
            .set(children, { opacity: 0 })
            .call(() => {
                overlay.setAttribute("data-triggered", '');
            })
            .to(overlay, { opacity: 1 })
            .to(children, { opacity: 1, stagger: 0.2 })
    }

    static closeOverlay() {
        const overlay = selectAll("[data-triggered]");
        const tl = gsap.timeline();

        tl
            .to(overlay, { opacity: 0 })
            .call(() => {
                overlay.forEach(elem => elem.removeAttribute("data-triggered"));
                CommonSetup.clearTriggered();
            })
    }

    static async acceptProposal() {
        const button = this;
        const id = button.dataset.identifier;

        try {
            CommonSetup.attachSpinner({ elem: button });

            const response = await fetch('/accept-task', {
                method: 'POST',
                body: JSON.stringify({ id }),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            };

            const data = await response.json();

            new Alert(data);
            CommonSetup.detachSpinner({ elem: button });

            CommonSetup.refreshProposal(id);
        } catch (error) {
            new Alert({
                message: "Couldn't accept proposal, please try again",
                type: 'error'
            });
            CommonSetup.detachSpinner({ elem: button });
            console.error('Fetch error:', error.message);
        }
    }

    static async certifyProposal() {
        const button = this;
        const id = button.dataset.identifier;

        try {
            CommonSetup.attachSpinner({ elem: button });

            const response = await fetch('/certify-task', {
                method: 'POST',
                body: JSON.stringify({ id }),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            };

            const data = await response.json();

            new Alert(data);
            CommonSetup.detachSpinner({ elem: button });

            CommonSetup.refreshProposal(id);
        } catch (error) {
            new Alert({
                message: "Couldn't accept proposal, please try again",
                type: 'error'
            });
            CommonSetup.detachSpinner({ elem: button });
            console.error('Fetch error:', error.message);
        }
    }

    static refreshProposal(id) {
        if (!id) console.warn("No identifier for proposal refresh");

        const overlay = select('#task');
        const children = overlay.children;
        const tl = gsap.timeline();

        tl
            .to(children, { opacity: 0 })
            .call(() => {
                CommonSetup.clearTriggered();
                CommonSetup.handleTaskTrigger(id);
            })
            .to(children, { opacity: 1, stagger: 0.2, delay: 0.5 })
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

    //File select
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

    static handleChatFiles(event) {
        const input = event.target;
        const file = input.files[0];
        const dont_preview = true;
        const url = '/chat-upload';
        const id = input.dataset.identifier;

        CommonSetup.uploadFile({ file, input, dont_preview, url, id, onComplete: () => CommonSetup.refreshProposal(id) });
    }

    static async refreshActivities(id = null) {
        if (!id) {
            new Alert({ message: "Missing identifier to refresh activity, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initTasks = new Items({ table: 'tasks', id })
            const [task] = await initTasks.find();

            const initActivities = new Items({ table: 'activities', task_id: task.id })
            const activities = await initActivities.find();

            const initAttachments = new Items({ table: 'activities', task_id: task.id, type: 'file' })
            const attachments = await initAttachments.find();

            const initAllUsers = new Items({ custom: `SELECT * FROM users WHERE id IN (SELECT user_id FROM activities WHERE task_id = ${task.id})` })
            const allUsers = await initAllUsers.find();

            CommonSetup.showActivities({ activities, allUsers });
            CommonSetup.showAttachments({ attachments });
        } catch (error) {
            console.error('Error in refreshActivities:', error);
            new Alert({ message: "Error updating activity, please try again", type: 'error' });
        }
    }

    static uploadFile(params = {}) {
        const { file, input, dont_preview, url, id, onComplete } = params;
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
        if (id) formData.append('task_id', id);

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

                    if (!dont_preview) displayPreview(data.filename);

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

                    if (onComplete) onComplete();
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

        xhr.open('POST', url || '/upload', true);
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

        upload?.remove();

        if (parent) {
            selectWith(parent, 'iframe')?.remove();
            parent.classList.remove("none");
        }
    }

    //Handle form submissions
    initializeForms() {
        selectAll("form").forEach(form => form.addEventListener("submit", CommonSetup.handleFormSubmission))
    }

    static async handleFormSubmission(event) {
        event.preventDefault();

        const form = event.target;
        if (!(form instanceof HTMLElement)) return new Alert({ message: "Couldn't find form data for submission", type: 'warning' });

        var button = selectWith(form, 'button[type="submit"]');
        if (!button) button = select(`button[type="submit"][form=${form.getAttribute("id")}]`);

        CommonSetup.attachSpinner({ elem: button });

        const formData = new FormData(form);
        const url = form.action;

        formData.delete('pdfFile');

        if (!url) return location.reload();

        try {
            const response = await fetch(url, {
                method: "POST",
                body: Methods.formDataToJson(formData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.invalidKeys) {
                //If there are invalid inputs display messages
                Methods.assignErrorMsgs(data.invalidKeys);
                CommonSetup.detachSpinner({ elem: button });
            } else {
                if (response.ok) {
                    if (data?.url) return window.location.href = data?.url || "/";
                    else {
                        //If request successful, show alert
                        form?.reset();
                        new Alert(data);

                        if (data?.clean_up) {
                            if (data.clean_up == 'message') {
                                CommonSetup.refreshProposal(data.task_id);
                            }
                        }

                        const parent = select('label[data-preview="pdfFile"]');
                        CommonSetup.resetFileInput(null, null, parent)
                        CommonSetup.detachSpinner({ elem: button });
                    }
                } else {
                    //If there was a problem in the backend, display alert
                    new Alert(data);
                    CommonSetup.detachSpinner({ elem: button });
                }
            };
        } catch (error) {
            new Alert({ message: 'Error submitting the form, please try again', type: 'error' });
            CommonSetup.detachSpinner({ elem: button });
            console.error('Error:', error);
        }
    }
}

class Items {
    constructor(params = {}) {
        Object.assign(this, params);
    }

    async find() {
        try {
            const response = await fetch('/get-items', {
                method: 'POST',
                body: JSON.stringify(this),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error.message);
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