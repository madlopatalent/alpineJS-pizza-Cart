function pizzaCart() {
    return {
        title: 'Pizza Cart API',
        pizzas: [],
        username: '',
        cartCode: '',
        cartPizzas: [],
        cartTotal: 0.00,
        paymentAmount: 0.00,
        cartVisible: true,
        message: '',
        paymentTotal: 0.00,
        featuredPizzas: [],
        cartId: '',
        isLoggedIn: false,
        cartId: '',
        historicalOrders: [],
        login() {
            if (this.username.length > 2) {
                localStorage.setItem('username', this.username)
                this.createCart();
                this.getFeaturedPizzas();
                this.isLoggedIn = true;
            } else {
                alert('username is too short');
                this.cartVisible = false;
            }
        },
        logout() {
            if (confirm('Do you want to LogOut?')) {
                localStorage['cartCode'] = '';
                this.cartCode = '';
                this.username = '';
                localStorage['username'] = '';
                this.isLoggedIn = false;
                this.featuredPizzas = [];
            }

        },
        createCart() {
            if (!this.username) {
                this.cartCode = 'No User Name to Create a Cart For';
                return Promise.resolve();
            }

            const cartCode = localStorage['cartCode'];
            if (cartCode) {
                this.cartCode = cartCode;
                return Promise.resolve();
            } else {
                const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                return axios.get(createCartURL)
                    .then(result => {
                        this.cartCode = result.data.cart_code;
                        localStorage['cartCode'] = this.cartCode;
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
            })
                .then(() => {
                    this.showCartData();
                })

        },
        removePizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                "cart_code": this.cartCode,
                "pizza_id": pizzaId
            })
                .then(() => {
                    this.showCartData();
                })
        },
        pay(amount) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay',
                {
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
            const storedUsername = localStorage['username'];
            if (storedUsername) {
                this.username = storedUsername;
                this.isLoggedIn = true;
            }


            axios.get('https://pizza-api.projectcodex.net/api/pizzas', { headers: { 'Cache-Control': 'no-store' } })
                .then(result => {
                    this.pizzas = result.data.pizzas;
                });

            if (!this.cartCode) {
                this.createCart()
                    .then(() => {
                        this.showCartData();
                    });
            } else {
                this.showCartData();
            }
            this.getFeaturedPizzas();

        },
        addPizzaToCart(pizzaId) {
            return this.addPizza(pizzaId);
        },

        // addPizzaToCart(pizzaId) {
        //     alert(pizzaId)

        //         // .then(() => {
        //         //     this.showCartData();
        //         // })
        // },

        getFeaturedPizzas() {
            const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
            axios.get(featuredPizzasURL, { headers: { 'Cache-Control': 'no-store' } })
                .then(response => {
                    if (response.data && Array.isArray(response.data.pizzas)) {

                        this.featuredPizzas = response.data.pizzas.slice(0, 3);
                    } else {

                        this.featuredPizzas = [];
                    }
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
        
        // init() {
        //     this.fetchHistoryCart();
        // },
// fetchHistoryCart(){
// axios.get(`https://pizza-api.projectcodex.net/api/pizza-cart/username/${this.username}`

// )
// .then((res) => {
//     const carts = res.data;
//     carts.forEach((cart) => {
//         if (cart.status == 'paid') {
//          const cartCode = cart.cart_code;
//          axios.get(
//             `https://pizza-api.projectcodex.net/api/pizza-cart/${cartCode}/get`
//          )  
//          .then((res) => {
//             const crtData = res.data;
//             console.log('Cart Data:', cartData);
//             this.history =[...cartData.pizzas, ...this.history];
//             console.log('History', this.history);
//          }); 
//         }
        
//     });
// })
// },

        payForCart() {
            this
                .pay(this.paymentAmount)
                .then(result => {
                    if (result.data.status == 'failure') {
                        this.message = result.data.message;
                        setTimeout(() => this.message = '', 4000);
                    } else {
                        const change = this.paymentAmount - this.cartTotal;
                        if (change > 0) {
                            this.message = `Payment received. Your change is R${change.toFixed(2)}`;
                        } else {
                            this.message = 'Payment received';
                        }
                        setTimeout(() => {
                            this.message = '';
                            this.cartPizzas = [];
                            this.cartTotal = 0.00;
                            this.paymentTotal = 0.00; // Update payme
                            localStorage.removeItem('cartCode');
                            localStorage['cartCode'] = '';
                            this.cartCode = '';
                            this.paymentAmount = 0;
                            this.createCart();
                        }, 3000);
                    }
                });
        },



        // payFo
        // payForCart() {
        //     if (this.paymentAmount < this.cartTotal) {
        //         this.message = 'Payment failed! Insufficient amount.';
        //         setTimeout(() => this.message = '', 4000);
        //         return;
        //     }

        //     return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
        //         "cart_code": this.cartCode,
        //         "payment_amount": this.paymentAmount
        //     })
        //     .then(result => {
        //         console.log('Payment response:', result.data);
        //         if (result.data.status === 'failure') {
        //             this.message = result.data.message;
        //             setTimeout(() => {
        //                 this.message = '';
        //             }, 4000);
        //         } else {
        //             this.message = 'Payment received';
        //             setTimeout(() => {
        //                 this.message = '';
        //                 this.cartPizzas = [];
        //                 this.cartTotal = 0.00;
        //                 this.cartCode = '';
        //                 this.paymentAmount = 0;
        //                 this.cartVisible = false; // Hide the cart after successful payment
        //                 this.createCart();
        //             }, 3000);
        //         }
        //     })
        // payForCart() {
        //     return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
        //         "cart_code": this.cartCode,
        //         "payment_amount": this.paymentAmount
        //     })
        //         .then(result => {
        //             if (result.data.status = 'failure') {
        //                 this.message = result.data.message;
        //                 setTimeout(() => this.message = '', 4000);
        //             } else {
        //                 this.message = 'Payment received';
        //                 setTimeout(() => {
        //                     this.message = '';
        //                     this.cartPizzas = [];
        //                     this.cartTotal = 0.00;
        //                     this.cartCode = '';
        //                     this.paymentAmount = 0;
        //                     this.createCart();
        //                 }, 3000);
        //             }
        //         })
        // }


        // addPizza(pizzaId) {
        //     console.log(pizzaId);
        //     const addPizzaURL = 'https://pizza-api.projectcodex.net/api/pizza-cart/add';
        //     axios.post(addPizzaURL, { pizza_id: pizzaId, cart_code: this.cartCode })
        //         .then(() => {
        //             this.showCartData();
        //         });
        // },
        // removePizza(pizzaId) {
        //     const removePizzaURL = 'https://pizza-api.projectcodex.net/api/pizza-cart/remove';
        //     axios.post(removePizzaURL, { pizza_id: pizzaId, cart_code: this.cartCode })
        //         .then(() => {
        //             this.showCartData();
        //         });
        // },
        // pay() {
        //     if (this.paymentAmount >= this.cartTotal) {
        //         this.message = 'Payment successful!';
        //         this.cartPizzas = [];
        //         this.cartTotal = 0;
        //         this.paymentAmount = 0;
        //     } else {
        //         this.message = 'Payment failed! Insufficient amount.';
        //     }
        // }
    };
}


document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCart', pizzaCart);
});