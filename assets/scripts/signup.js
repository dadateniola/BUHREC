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

    static setupForm() {
        const form = select("form");

        form.addEventListener("submit", async (event) => {
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
                            new Alert(data);
                            PageSetup.getForm({ page: data.next })
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
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('click', function () {
            const role = select(`label[for="${this.id}"]`);

            role.classList.toggle("checked");
        });
    });
}