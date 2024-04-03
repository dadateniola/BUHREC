class PageSetup {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    init() {
        const active = select(".progress.active");
        const page = selectWith(active, "h1").innerText.toLowerCase().split(" ").join("-");

        PageSetup.getForm({ page });
    }

    static async getForm(params = {}) {
        const { page } = params;
        const formBox = select(".form-box");

        try {
            const response = await fetch('/get-form', {
                method: 'POST',
                body: JSON.stringify({ form: page }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) return new Alert(data);

            formBox.innerHTML = data.html;

            PageSetup.setupForm();
            text()
        } catch (error) {
            new Alert({ message: 'There was an issue loading page contents', type: 'error' });
            console.error('Error:', error);
        }
    }

    static updateSidebar(params = {}) {
        const { active, completed } = params;

        if (!completed.length) return console.warn("Could no update sidebar as 'completed' is empty");

        selectAll(".sidebar .progress-box .progress").forEach(elem => {
            var state = null;
            const heading = selectWith(elem, 'h1').innerText;
            const head = heading.toLowerCase().split(" ").join("-");

            if (head == active) state = 'active';
            if (completed.includes(head)) state = 'completed';
            // if (head == 'verification-&-validation') state = 'none';

            elem.classList.remove("active", "completed", "none");
            if (state) elem.classList.add(state);
        })

    }

    static setupForm() {
        const form = select("form");

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const form = event.target;
            const button = selectWith(form, 'button[type="submit"]');

            CommonSetup.attachSpinner({ elem: button });

            const formData = new FormData(form);
            const url = form.action;

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
                            new Alert(data.alert);
                            PageSetup.getForm({ page: data.next })
                            PageSetup.updateSidebar({
                                active: data.next,
                                completed: data.completed
                            });

                            if (data.next == 'verification-&-validation') {
                                setTimeout(() => {
                                    window.location.href = '/dashboard';
                                }, 3000);
                            }
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
        })
    }
}

new PageSetup();

function text() {
    var radios = document.querySelectorAll('input[type="radio"]');

    radios.forEach(function (radio) {
        radio.addEventListener('click', function () {
            document.querySelectorAll('input[type="radio"]').forEach(elem => {
                const role = select(`label[for="${elem.id}"]`);
                if (elem.checked) {
                    role.classList.add("checked");
                } else {
                    role.classList.remove("checked");
                }
            })
        });
    });
}