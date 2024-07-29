function pizzaCart() {
    return {
        title: 'Pizza Cart API',
        pizzas: [],
        username: '',
        cartCode: '',
        cartPizzas: [],
        cartTotal: 0.00,
        paymentAmount: 0.00,
        message: '',
        paymentTotal: 0.00,
        featuredPizzas: [],
        isLoggedIn: false,
        showOrders: false,
        historicalOrders: [],

        login() {
            if (this.username.length > 2) {
                localStorage.setItem('username', this.username);
                this.createCart();
                this.getFeaturedPizzas();
                this.isLoggedIn = true;
                this.getHistoricalOrders(); // Load historical orders on login
            } else {
                alert('Username is too short');
            }
        },

        logout() {
            if (confirm('Do you want to LogOut?')) {
                localStorage.removeItem('username');
                localStorage.removeItem('cartCode');
                this.username = '';
                this.cartCode = '';
                this.isLoggedIn = false;
                this.featuredPizzas = [];
            }
        },

        createCart() {
            if (!this.username) {
                this.cartCode = 'No User Name to Create a Cart For';
                return Promise.resolve();
            }

            const cartCode = localStorage.getItem('cartCode');
            if (cartCode) {
                this.cartCode = cartCode;
                return Promise.resolve();
            } else {
                const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                return axios.get(createCartURL)
                    .then(result => {
                        this.cartCode = result.data.cart_code;
                        localStorage.setItem('cartCode', this.cartCode);
                    });
            }
        },

        getCart() {
            const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartCode}/get`;
            return axios.get(getCartURL);
        },

        addPizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                "cart_code": this.cartCode,
                "pizza_id": pizzaId
            }).then(() => this.showCartData());
        },

        removePizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                "cart_code": this.cartCode,
                "pizza_id": pizzaId
            }).then(() => this.showCartData());
        },

        pay(amount) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                "cart_code": this.cartCode,
                amount
            });
        },

        showCartData() {
            this.getCart().then(result => {
                const cartData = result.data;
                if (cartData && cartData.pizzas) {
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = parseFloat(cartData.total?.toFixed(2));
                    this.paymentTotal = parseFloat(cartData.total?.toFixed(2));
                } else {
                    this.cartPizzas = [];
                    this.cartTotal = 0.00;
                    this.paymentTotal = 0.00;
                }
            }).catch(error => {
                console.error('Error fetching cart data:', error);
                this.cartPizzas = [];
                this.cartTotal = 0.00;
                this.paymentTotal = 0.00;
            });
        },

        init() {
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
                this.username = storedUsername;
                this.isLoggedIn = true;
                this.createCart().then(() => {
                    this.showCartData();
                });
            }

            axios.get('https://pizza-api.projectcodex.net/api/pizzas', { headers: { 'Cache-Control': 'no-store' } })
                .then(result => {
                    this.pizzas = result.data.pizzas;
                });

            this.getFeaturedPizzas();
        },

        addPizzaToCart(pizzaId) {
            return this.addPizza(pizzaId);
        },

        getFeaturedPizzas() {
            const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
            axios.get(featuredPizzasURL, { headers: { 'Cache-Control': 'no-store' } })
                .then(response => {
                    this.featuredPizzas = response.data.pizzas.slice(0, 3);
                })
                .catch(error => {
                    console.error('Error fetching featured pizzas:', error);
                    this.featuredPizzas = [];
                });
        },

        setFeaturedPizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizzas/featured', {
                username: this.username,
                pizza_id: pizzaId
            }, { headers: { 'Cache-Control': 'no-store' } }).then(() => {
                this.getFeaturedPizzas();
            });
        },

        payForCart() {
            if (this.paymentAmount <= 0 || this.cartTotal <= 0) {
                this.message = 'Invalid payment or cart total';
                setTimeout(() => this.message = '', 4000);
                return;
            }

            this.pay(this.paymentAmount).then(result => {
                if (result.data.status === 'failure') {
                    this.message = result.data.message;
                    setTimeout(() => this.message = '', 4000);
                } else {
                    const change = this.paymentAmount - this.cartTotal;
                    if (change > 0) {
                        this.message = `Payment received. Your change is R${change.toFixed(2)}`;
                    } else {
                        this.message = 'Payment received';
                    }

                    const order = {
                        total: this.cartTotal,
                        pizzas: this.cartPizzas
                    };
                    this.saveOrderToLocalStorage(order);

                    setTimeout(() => {
                        this.message = '';
                        this.cartPizzas = [];
                        this.cartTotal = 0.00;
                        this.paymentTotal = 0.00;
                        localStorage.removeItem('cartCode');
                        this.cartCode = '';
                        this.paymentAmount = 0;
                        this.createCart();
                    }, 3000);
                }
            }).catch(error => {
                this.message = 'Payment failed. Please try again.';
                console.error('Payment error:', error);
                setTimeout(() => this.message = '', 4000);
            });
        },

        toggleOrders() {
            this.showOrders = !this.showOrders;
            if (this.showOrders) {
                this.getHistoricalOrders();
            }
        },

        saveOrderToLocalStorage(order) {
            let ordersKey = `${this.username}_historicalOrders`;
            let orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
            orders.push(order);
            localStorage.setItem(ordersKey, JSON.stringify(orders));
        },

        getHistoricalOrders() {
            let ordersKey = `${this.username}_historicalOrders`;
            this.historicalOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
        },
    };
}

document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCart', pizzaCart);
});
