function makeRow() {
    const element = document.createElement(`div`)
    element.setAttribute("class", "row g-4");
    return element;
}

function makeElement(data) {
    const link = data["image-link"];

    const IndividualElement = `<div class="col-xl-3 col-lg-4 col-md-6 wow fadeInUp mb-4" data-wow-delay="0.1s">
                            <div class="product-item">
                                <div class="position-relative bg-light overflow-hidden">
                                    <img class="img-fluid w-100" src=` + 'img/products/' + link + '.jpg' + ` alt=` + data.name + `>
                                </div>
                                <div class="text-center p-3">
                                    <span class="d-block h5 mb-2">${data.name}</span>
                                    <span class="text-primary me-1">Rs ${data.price}</span>
                                    <span class="text-dark me-1 d-block x-small">[${data.weight}]</span>
                                </div>
                                <div class="d-flex border-top">
                                    <small class="w-100 text-center py-2">
                                        <a class="text-body" href=` + data.whatsappLink + ` target="_blank"><i class="fa fa-shopping-bag text-primary me-2"></i>Order Now</a>
                                    </small>
                                </div>
                            </div>
                        </div>`

    return IndividualElement;
}

function loopOnPronducts(items) {
    var data = ``;
    items.products.map(item => {
        data = data + makeElement(item);
    })
    return data
}

function makeParentCategory(index, tabId) {
    const element = document.createElement(`div`)
    element.setAttribute("id", `${tabId}`);
    element.setAttribute("class", `tab-pane fade show p-0 ${index === 1 ? 'active' : ''}`);
    return element;
}

function loopOnCategories(data) {
    var tab_content = document.getElementById('tab-content');
    var tabs_li = document.getElementById('tabs-li');
    var tabs = '';
    Object.entries(data).map(([key, item], index) => {
        const category_parent = makeParentCategory(index + 1, key);
        tabs = tabs + makeCategoriesTab(key, item.name, index + 1);
        const row = makeRow();
        var products = loopOnPronducts(item);
        row.innerHTML = products;

        category_parent.appendChild(row);
        tab_content.appendChild(category_parent);
    });
    tabs_li.innerHTML = tabs
}

async function readJson () {
    let json;
    await fetch('./json/products.json')
        .then((response) => response.json())
        .then((json_res) => json = json_res);
    return json
}

function makeCategoriesTab (key, name, index) {
    return `<li class="nav-item me-2">
                            <a class="btn btn-outline-primary border-2 ${index === 1 ? 'active' : ''}" data-bs-toggle="pill" href=#` + key + `>${name}</a>
                        </li>`;
}

window.addEventListener('load', (event) => {
    readJson().then((data) => {
        loopOnCategories(data);
    }).catch(e => console.log('readJson', e));
});
