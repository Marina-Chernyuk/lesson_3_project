'use scrict'

const API = 'https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses';

class List { // класс List базовый для товара каталога и товара корзины
  constructor(url, container, list = list2){
      this.container = container;
      this.list = list;
      this.url = url;
      this.goods = []; //массив из JSON документа
      this.allProducts = []; // массив объектов соответствующего класса
      this._init(); // для того, чтобы не вызывать init (регистрацию события) явно, включаем его в свойства базового класса и тогда он вызывается сам
    }
    getJson(url){ // метод для получения данных с внешнего API
        return fetch(url ? url : `${API + this.url}`) // парсить можно как с внешнего ресурса, так и с локального файла json
            .then(result => result.json())
            .catch(error => {
                console.log(error);
            })
    }
    handleData(data){ // метод на вход принимает массив товаров data
        this.goods = [...data]; // получаем массив товаров
        this.render(); // и выводим массив товаров на экоан
    }
    calcSum(){ // сумма товаров
        return this.allProducts.reduce((accum, item) => accum += item.price, 0);
    }
    render(){ // генерация (вывод на страницу) вёрстки всех товаров (для каталога товаров и товаров корзины он общий)
        const block = document.querySelector(this.container);
        for (let product of this.goods){
            //console.log(this.constructor.name);
            const productObj = new this.list[this.constructor.name](product);// создали объект товара либо CartItem (товар корзины), либо ProductItem (товар каталога)
            console.log(productObj);
            this.allProducts.push(productObj);
            block.insertAdjacentHTML('beforeend', productObj.render());
        }
    }
    _init(){ // регистрация события
        return false
    }
}

class Item {  // базовый класс товара (имеет общие свойства товаров каталога и корзины)
    constructor(el, img = 'img/products.jpg') {
      this.product_name = el.product_name;
      this.price = el.price;
      this.id_product = el.id_product;
      this.img = img;
    }
  
    render() { // генерация (вёрстка) товара (карточки) для каталога товаров 
      return `<div class="product-item" data-id="${this.id_product}">
                    <img src="${this.img}" alt="image" class="product-img">
                    <div class="desc">
                    <h3 class="title">${this.product_name}</h3>
                    <p class="price">${this.price} \u20bd</p>
                    <button class="buy-btn "
                    data-id="${this.id_product}"
                    data-name="${this.product_name}"
                    data-price="${this.price}">Купить</button>
                    </div>
            </div>`;
    }
  }

class ProductsList extends List{ // класс ProductsList (список товаров) потомок класса List
    constructor(cart, container = '.products', url = "/catalogData.json"){
        super(url, container); // вызываем конструктор базового класса 
        this.cart = cart;
        this.getJson()
            .then(data => this.handleData(data));// handleData запускает отрисовку либо каталога товаров, либо списка товаров корзины
    }
    _init(){ // привязываем click к кнопке "купить" и добавляем товар в корзину
        document.querySelector(this.container).addEventListener('click', e => {
            if(e.target.classList.contains('buy-btn')){
//                console.log(e.target);
                this.cart.addProduct(e.target);
            }
        });
        
    }
}


class ProductItem extends Item{}

class Cart extends List{ //список товаров корзины (класс Cart потомок класса List)
    constructor(container = ".cart-block", url = "/getBasket.json"){
        super(url, container); // вывываем базовый конструктор
        this.getJson()
            .then(data => {
                this.handleData(data.contents);//вывели все товары в корзине 
            });
    }
    addProduct(element){ // метод добавляет товар в корзину
        this.getJson(`${API}/addToBasket.json`) // дополнительно парсим файл addToBasket.json, чтобы убедиться, что есть связь с сервером
         // файл addToBasket.json находится на гитхабе аккаунта GB ( ссылка в 1 уроке)
            .then(data => {
                if(data.result === 1){ // после парсинга получаем 1
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if(find){
                        find.quantity++;
                        this._updateCart(find); //обновляем контент корзины, если этот товар уже в ней есть
                    } else {
                        let product = { //если этого товара нет в корзине, значит создаем его
                            id_product: productId,
                            price: +element.dataset['price'],
                            product_name: element.dataset['name'],
                            quantity: 1
                        };
                        this.goods = [product];
                        this.render();
                    }
                } else {
                    alert('Error');
                }
            })
    }
    removeProduct(element){ // метод удаляет товар из коззины
        this.getJson(`${API}/deleteFromBasket.json`) // проверяем связь с сервером через парсинг файла deleteFromBasket.json
            .then(data => {
                if(data.result === 1){ // после парсинга получаем ответ: 1
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if(find.quantity > 1){ // проверяем количество товара в корзине. Если оно больше 1, уменьшаем на 1
                        find.quantity--;
                        this._updateCart(find); // затем перерисовываем вёстку корзины
                    } else { // если товар в единственном числе
                        this.allProducts.splice(this.allProducts.indexOf(find), 1); // то удаляем его из корзины
                        document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
                    }
                } else {
                    alert('Error');
                }
            })
    }
    _updateCart(product){
       let block = document.querySelector(`.cart-item[data-id="${product.id_product}"]`);
       block.querySelector('.product-quantity').textContent = `Quantity: ${product.quantity}`;
       block.querySelector('.product-price').textContent = `$${product.quantity*product.price}`;
    }
    _init(){ // регистрация события показа/сокрытия корзины и удаления товара из корзины
        document.querySelector('.btn-cart').addEventListener('click', () => { // кликая на корзинку либо показываем её, либо скрываем
            document.querySelector(this.container).classList.toggle('invisible');
        });
        document.querySelector(this.container).addEventListener('click', e => { // кликая на товар удаляем его из корзины
           if(e.target.classList.contains('del-btn')){
               this.removeProduct(e.target);
           }
        })
    }

}

class CartItem extends Item{ // класс товара корзины CartItem наследуется от класса товара Item
    constructor(el, img = 'img/products.jpg'){
        super(el, img); // вызываем конструктор от базавого класса Item
        this.quantity = el.quantity; // свойство "количество"
    }
    render(){
        //верстка каждого товара корзины с кнопкой "УДАЛИТЬ" (<button class="del-btn" data-id="${this.id_product}">&times;</button>)
    return `<div class="cart-item" data-id="${this.id_product}">
            <div class="product-bio">
            <img src="${this.img}" alt="Some image">
            <div class="product-desc">
            <p class="product-title">${this.product_name}</p>
            <p class="product-quantity">Quantity: ${this.quantity}</p>
        <p class="product-single-price">$${this.price}</p>
        </div>
        </div>
        <div class="right-block">
            <p class="product-price">$${this.quantity*this.price}</p>
            <button class="del-btn" data-id="${this.id_product}">&times;</button> 
        </div>
        </div>`
    }
}
const list2 = {
    ProductsList: ProductItem,
    Cart: CartItem
};


let cart = new Cart();
let products = new ProductsList(cart);//Если мы хотим использовать в классе
//методы другого класса, то удобнее всего в конструктор передать объект класса,
//методы которого нам нужны в данном классе
//products.getJson(`getProducts.json`).then(data => products.handleData(data));

