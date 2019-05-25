jQuery(document).ready(function ($) {
    let containers = {
        BUTTON: '#gaspar_button',
        CONTAINER: '#gaspar_container',
        PREVIEW_CONTAINER: '#gaspar_preview_container',
        OPEN_ICON: '.open_gaspar',
        CLOSE_ICON: '#close_gaspar',
        INPUT: '#gaspar_input',
        SEND_BUTTON: '#send_button',
        QUEUE: '#message_queue'
    };

    let gaspar = {
        button: $(containers.BUTTON),
        body: $(containers.CONTAINER),
        input: $(containers.INPUT),
        send: $(containers.SEND_BUTTON),
        messageQueue: [],
        previewTimer: null,
        opened: false,
        foodList: [],
        wineList: [],
        place: 1333,
        lang: 'en',
        user_id: 0,
        wines: false,
        pairing: false,
        pause_timer: 700,
        type_timer: 1500,
        wineMessage: '',
        previous_sender: 'gaspar',
        initialize: function () {
            let self = this;
            $('#gaspar_input').keydown(function (e) {
                e.keyCode === 13 ? (e.preventDefault(), self.inputSended()) : null;
            });
            $('#send_button').on('click', function () {
                self.inputSended();
            });
            $('#gaspar_input').on('input', function () {
                $('#gaspar_bottom').outerHeight(60 + $('#gaspar_input').outerHeight());
            });
            $('#gaspar_button').on('click', self.clickButton);
            // let preview = $(containers.PREVIEW_CONTAINER);
            // this.input.keydown(function (e) {
            //     e.keyCode === 13 ? (e.preventDefault(), self.inputSended()) : null;
            // });
            // this.send.on('click', function () {
            //     self.inputSended();
            // });
            // this.input.on('input', function () {
            //     $('#gaspar_bottom').outerHeight(60 + $('#gaspar_input').outerHeight());
            // });
            let new_id = self.getRandomId(1000, 9999);
            console.log(`ID: ${new_id}`);
            let cookie = self.getCookie('user_id');
            if (!cookie) {
                self.setCookie('user_id', new_id);
            }
            self.user_id = cookie;
            console.log(`Cookie: ${self.user_id}`);
            self.postToAPI('Hello');
        },
        getRandomId: function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        },
        clickButton: function () {
            let self = this;
            let body = $(containers.CONTAINER);
            let preview = $(containers.PREVIEW_CONTAINER);
            if (!self.opened) {
                $(containers.PREVIEW_CONTAINER).hide('drop', {direction: 'down'}, 600);
                clearTimeout(self.previewTimer);
                $(containers.BUTTON).hide('scale', {percent: 0, direction: 'horizontal'}, 600, function () {
                    $(containers.OPEN_ICON).css('display', 'none');
                    $(containers.CLOSE_ICON).css('display', 'block');
                    $(containers.BUTTON).show('scale', {percent: 0, direction: 'horizontal'}, 600);
                });
                body.toggle('drop', {direction: 'down'}, 1000, function () {
                    body.css('display', 'flex');
                });
                self.opened = true;
            } else {
                body.toggle('drop', {direction: 'down'}, 1000);
                $(containers.BUTTON).hide('scale', {percent: 0, direction: 'horizontal'}, 600, function () {
                    $(containers.OPEN_ICON).css('display', 'block');
                    $(containers.CLOSE_ICON).css('display', 'none');
                    $(containers.BUTTON).show('scale', {percent: 0, direction: 'horizontal'}, 600);
                });
                self.opened = false;
                self.previewTimer = setTimeout(function () {
                    $(containers.PREVIEW_CONTAINER).show('drop', {direction: 'down'}, 600);
                }, 10000);
                clearTimeout(self.previewTimer);
            }
        },
        inputSended: function (text) {
            let inputText = text || $(containers.INPUT).text();
            $('.filter').hide('drop', {direction: 'right'}, 700);
            $('#message_queue').animate({paddingBottom: '8px'}, 600);
            let self = this;
            self.addMessage(inputText, 'user', 'text');
            $(containers.INPUT).empty();
        },
        addMessage: function (value, sender, type) {
            let self = this;
            setTimeout(function () {
                let options = {direction: ''};
                sender === 'gaspar' ? (options.direction = 'up') : options.direction = 'right';
                switch (type) {
                    case 'text':
                        self.addText(value, sender, options);
                        break;
                    case 'button':
                        self.addButtons(value, options, sender);
                        break;
                    case 'carousel':
                        self.addCarousel(value);
                        break;
                }
                self.messageQueue.length === 0 ?
                    self.scrollQuery(400) : null;
            }, 600);
        },
        addText: function (text, sender, options) {
            let self = this;
            let newMessage = document.createElement('div');
            $(newMessage).addClass('message ' + sender + '_message');
            $(newMessage).css('display', 'none');
            if (self.lang !== 'en') {
                let myInit = {
                    method: 'GET'
                };
                let request = new Request('http://localhost:1880/translation/?value=' + text + '&lang=' + self.lang, myInit);
                fetch(request).then(function (response) {
                    return response.json();
                }).then(function (jsonResponse) {
                    let translated = jsonResponse.response.translations[0].translation;
                    $(newMessage).append(translated);
                    $(newMessage).appendTo(containers.QUEUE);
                    $(newMessage).show('drop', options, 400);
                });
            } else {
                $(newMessage).addClass('message ' + sender + '_message');
                $(newMessage).append(text);
                $(newMessage).appendTo(containers.QUEUE);
                $(newMessage).show('drop', options, 400);
            }
            if (sender === self.previous_sender) {
                setTimeout(() => {
                    $(newMessage).animate({marginTop: '5px'}, 200);
                }, 500);
            }
            $('#gaspar_preview_container').find('.preview_text').empty().text(text);
            if (sender === 'user') {
                self.postToAPI(text);
            } else {
                if ($('#gaspar_container').css('display') !== 'flex') {
                    $('#gaspar_preview_container').show('drop', options, 700);
                }
            }
            self.previous_sender = sender;
        },
        addButtons: function (button, options, sender) {
            let self = this;
            let newMessage = document.createElement('div');
            $(newMessage).addClass('button');
            if (self.lang !== 'en') {
                let myInit = {
                    method: 'GET'
                };
                let request = new Request('http://localhost:1880/translation/?value=' + button.label + '&lang=' + self.lang, myInit);
                fetch(request).then(function (response) {
                    return response.json();
                }).then(function (jsonResponse) {
                    button.label = jsonResponse.response.translations[0].translation;
                    $(newMessage).append(button.label);
                    $(newMessage).css('display', 'none');
                    newMessage.addEventListener('click', function () {
                        let regExp = /:\s(\w*)/gi;
                        let buttonLocale = regExp.exec(button.label);
                        if (!buttonLocale) {
                            self.addMessage(button.label, 'user', 'text');
                        } else {
                            self.lang = buttonLocale[1];
                            self.postToAPI('Hello');
                        }
                    });
                    $(newMessage).appendTo(containers.QUEUE);
                    $(newMessage).show('drop', options, 400);
                });
            } else {
                $(newMessage).append(button.label);
                $(newMessage).css('display', 'none');
                newMessage.addEventListener('click', function () {
                    let regExp = /:\s(\w*)/gi;
                    let buttonLocale = regExp.exec(button.label);
                    if (!buttonLocale) {
                        self.addMessage(button.label, 'user', 'text');
                    } else {
                        self.lang = buttonLocale[1];
                        self.postToAPI('Hello');
                    }
                });
                $(newMessage).appendTo(containers.QUEUE);
                $(newMessage).show('drop', options, 400);
            }
            if (sender === self.previous_sender) {
                setTimeout(() => {
                    $(newMessage).animate({marginTop: '5px'}, 200);
                }, 500);
            }
            if (sender === self.previous_sender) {
                $(newMessage).css('margin-top', '5px');
            }
            self.previous_sender = sender;
        },
        addCarousel: function (cards) {
            let self = this;
            let carousel = document.createElement('div');
            $(carousel).addClass('card_carousel');
            cards.forEach(function (card) {
                let imageHolder = card.image || 'img/wines_in_my_wish_list.jpg';
                let _score = card.overall_wp_score;
                let foodMatch = card.normalised_foodmatch || null;
                let normalizedMatch = '';
                let notes = card.wm_notes.slice(0, 80);
                let notesMore = '';
                if (card.wm_notes.length > 0) {
                    notesMore = 'Read More'
                }
                if (card.wine_subtype_name.length > 0) {
                    card.wine_subtype_name = ', ' + card.wine_subtype_name;
                }
                if (foodMatch) {
                    normalizedMatch = foodMatch.toString().slice(0, 3);
                } else {
                    normalizedMatch = 'null';
                }
                let score = _score.toString().slice(0, 3);
                let bottleSize = '';
                if (card.price_koeff >= 0.375 && card.price_koeff <= 0.5) {
                    bottleSize = '1_2 bottle';
                } else if (card.price_koeff > 0.5 && card.price_koeff <= 1.0) {
                    bottleSize = 'bottle';
                } else if (card.price_koeff > 1.0) {
                    bottleSize = 'big bottle';
                }
                let colorIMG = 'img/' + card.wine_type_name + '/' + bottleSize + '.png';
                let ratingColor = '';
                let scoreColor = '';
                let matchColor = '';
                if (card.overall_rating > 60 && card.overall_rating <= 65) {
                    ratingColor = '#ca2d26';
                } else if (card.overall_rating > 65 && card.overall_rating <= 70) {
                    ratingColor = '#de5a25';
                } else if (card.overall_rating > 70 && card.overall_rating <= 75) {
                    ratingColor = '#f47220';
                } else if (card.overall_rating > 75 && card.overall_rating <= 80) {
                    ratingColor = '#f8b316';
                } else if (card.overall_rating > 80 && card.overall_rating <= 85) {
                    ratingColor = '#d4da22';
                } else if (card.overall_rating > 85 && card.overall_rating <= 90) {
                    ratingColor = '#abd036';
                } else if (card.overall_rating > 90 && card.overall_rating <= 95) {
                    ratingColor = '#75c042';
                } else if (card.overall_rating > 95) {
                    ratingColor = '#3ab764';
                }
                if (normalizedMatch > 2 && normalizedMatch <= 3) {
                    matchColor = '#ca2d26';
                } else if (normalizedMatch > 3 && normalizedMatch <= 4) {
                    matchColor = '#de5a25';
                } else if (normalizedMatch > 4 && normalizedMatch <= 5) {
                    matchColor = '#f47220';
                } else if (normalizedMatch > 5 && normalizedMatch <= 6) {
                    matchColor = '#f8b316';
                } else if (normalizedMatch > 6 && normalizedMatch <= 7) {
                    matchColor = '#d4da22';
                } else if (normalizedMatch > 7 && normalizedMatch <= 8) {
                    matchColor = '#abd036';
                } else if (normalizedMatch > 8 && normalizedMatch <= 9) {
                    matchColor = '#75c042';
                } else if (normalizedMatch > 9 && normalizedMatch <= 10) {
                    matchColor = '#3ab764';
                }
                if (score > 2 && score <= 3) {
                    scoreColor = '#ca2d26';
                } else if (score > 3 && score <= 4) {
                    scoreColor = '#de5a25';
                } else if (score > 4 && score <= 5) {
                    scoreColor = '#f47220';
                } else if (score > 5 && score <= 6) {
                    scoreColor = '#f8b316';
                } else if (score > 6 && score <= 7) {
                    scoreColor = '#d4da22';
                } else if (score > 7 && score <= 8) {
                    scoreColor = '#abd036';
                } else if (score > 8 && score <= 9) {
                    scoreColor = '#75c042';
                } else if (score > 9 && score <= 10) {
                    scoreColor = '#3ab764';
                }
                $(carousel).append(`<div class="wine_card">
                                        <div class="wine_card_header">
                                            <div class="wine_header_name">
                                                ` + card.wine_name + `` + card.wine_subtype_name + `
                                            </div>
                                            <div class="wine_header_origin">
                                                ` + card.wine_year + ` ` + card.area_name + `
                                            </div>
                                            <div class="wine_images">
                                                <div class="wine_color">
                                                    <img src="` + colorIMG + `">
                                                </div>
                                                <div class="wine_image">
                                                    <img src="` + imageHolder + `">
                                                </div>
                                                <div class="wine_country">
                                                    <img src="` + card.country_flag + `">
                                                </div>
                                            </div>
                                            <div class="wine_properties">
                                                <div class="wine_property">
                                                    <span class="property_number">` + card.price + `</span>
                                                    <span class="property_name">price</span>
                                                </div>
                                                <div class="wine_property">
                                                    <span class="property_number" style="background: ${matchColor}">` + normalizedMatch + `</span>
                                                    <span class="property_name">food match</span>
                                                </div>
                                                <div class="wine_property">
                                                     <span class="property_number" style="background: ${ratingColor}">` + card.overall_rating + `</span>
                                                     <span class="property_name">rating</span>
                                                </div>
                                                <div class="wine_property">
                                                    <span class="property_number" style="background: ${scoreColor}">` + score + `</span>
                                                    <span class="property_name">score</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="wine_card_description">
                                            <span class="wine_description_name">` + card.main_view_grape + `</span>
                                            <p class="wine_description_text first_text">
                                                ` + notes + `<span class="notes_read_more">` + notesMore + `</span>
                                            </p>
                                            <p class="wine_description_text second_text">
                                                ` + card.wm_notes + `<span class="notes_read_less">Read Less</span>
                                            </p>
                                        </div>
                                    </div>`);
            });
            let leftButton = document.createElement('div');
            $(leftButton).addClass('carousel_button left_carousel_button');
            $(leftButton).on('click', function () {
                let currentScroll = $(carousel).scrollLeft();
                $('.card_carousel').animate({scrollLeft: currentScroll - 222}, 700);
            });
            $(leftButton).append('<i class="fas fa-chevron-left"></i>');
            let rightButton = document.createElement('div');
            $(rightButton).addClass('carousel_button right_carousel_button');
            $(rightButton).on('click', function () {
                let currentScroll = $(carousel).scrollLeft();
                $('.card_carousel').animate({scrollLeft: currentScroll + 222}, 700);
            });
            $(rightButton).append('<i class="fas fa-chevron-right"></i>');
            let carouselWrap = document.createElement('div');
            $(carouselWrap).addClass('carousel_holder');
            $(carouselWrap).append(leftButton);
            $(carouselWrap).append(rightButton);
            $(carouselWrap).append(carousel);
            $('#message_queue').append(carouselWrap);
            $('.notes_read_more').on('click', function () {
                $(this).parent().parent().parent().parent().animate({height: '324px', marginTop: '5px'}, 400);
                $('.wine_card').animate({marginTop: '77px'}, 500);
                $(this).parent().parent().parent().animate({height: '324px', marginTop: '0'}, 700);
                $(this).parent().parent().parent().find('.wine_description_text.first_text').css('display', 'none');
                $(this).parent().parent().parent().find('.wine_description_text.second_text').css('display', 'block');
                self.scrollQuery(400);
            });
            $('.notes_read_less').on('click', function () {
                $(this).parent().parent().parent().parent().animate({height: '250', marginTop: '5px'}, 400);
                $('.wine_card').animate({marginTop: '0'}, 500);
                $(this).parent().parent().parent().animate({height: '324px', marginTop: '0'}, 700);
                $(this).parent().parent().parent().find('.wine_description_text.first_text').css('display', 'block');
                $(this).parent().parent().parent().find('.wine_description_text.second_text').css('display', 'none');
                self.scrollQuery(400);
            });
        },
        setCookie: function (name, value, options) {
            options = options || {};

            var expires = options.expires;

            if (typeof expires === 'number' && expires) {
                var d = new Date();
                d.setTime(d.getTime() + expires * 1000);
                expires = options.expires = d;
            }
            if (expires && expires.toUTCString) {
                options.expires = expires.toUTCString();
            }

            value = encodeURIComponent(value);

            var updatedCookie = name + '=' + value;

            for (var propName in options) {
                updatedCookie += '; ' + propName;
                var propValue = options[propName];
                if (propValue !== true) {
                    updatedCookie += '=' + propValue;
                }
            }

            document.cookie = updatedCookie;
        },
        getCookie: function (name) {
            var matches = document.cookie.match(new RegExp(
                // eslint-disable-next-line no-useless-escape
                '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
            ));
            return matches ? decodeURIComponent(matches[1]) : undefined;
        },
        deleteCookie: function (name) {
            const self = this;
            self.setCookie(name, '', {
                expires: -1
            });
        },
        postToAPI: function (value, exit_case) {
            exit_case = exit_case || false;
            let myInit = {
                method: 'GET'
            };
            let self = this;
            let request = new Request('http://localhost:1880/watson/' + self.user_id + '/' + self.place + '/?value=' + value + '&lang=' + self.lang + '&wines=' + self.wines + '&pairing=' + self.pairing, myInit);
            fetch(request).then(function (response) {
                return response.json();
            }).then(function (jsonResponse) {
                console.log(jsonResponse);
                if (!exit_case) {
                    switch (jsonResponse.type) {
                        case 'dishes':
                            self.foodList = jsonResponse.data;
                            $('.filter_options').empty();
                            $('.filter_input_changeable').empty();
                            jsonResponse.data.forEach(function (dish) {
                                $('.filter').find('.filter_options').append('<div class="filter_option">' + dish + '</div>');
                            });
                            jsonResponse.text.forEach(function (step) {
                                if (step.response_type === 'text') {
                                    self.messageQueue.push({value: step.text, sender: 'gaspar', type: 'text'});
                                } else if (step.response_type === 'option') {
                                    self.messageQueue.push({value: step.title, sender: 'gaspar', type: 'text'});
                                    step.options.forEach(function (option) {
                                        self.messageQueue.push({value: option, sender: 'gaspar', type: 'button'});
                                    });
                                }
                            });
                            self.flushQueue(self.messageQueue);
                            setTimeout(() => {
                                $('#message_queue').animate({paddingBottom: '60px'}, 200);
                                $('.filter').show('drop', {direction: 'right'}, 600);
                            }, self.type_timer + 1000);
                            $('.filter_input_changeable').keydown(function (e) {
                                e.keyCode === 13 ? (e.preventDefault(), self.inputSended($('.filter_input_changeable').text())) : null;
                            });
                            $('.filter_input_changeable').on('input', () => {
                                let filteredFood = self.foodList.filter(function (element) {
                                    let ignoreCase = element.toLowerCase();
                                    let text = $('.filter_input_changeable').text().toLowerCase();
                                    return ignoreCase.includes(text);
                                    // return element.includes($('.filter_input_changeable').text());
                                });
                                $('.filter').find('.filter_options').empty();
                                filteredFood.forEach((food) => {
                                    $(' .filter').find('.filter_options').append('<div class="filter_option">' + food + '</div>');
                                });
                                $('.filter_option').on('click', function () {
                                    self.findFood = true;
                                    $('.filter').hide('drop', {direction: 'right'}, 700);
                                    self.addMessage($(this).text(), 'user', 'text');
                                    $('#message_queue').animate({paddingBottom: '8px'}, 700);
                                });
                            });
                            $('.filter_option').on('click', function () {
                                $('.filter').hide('drop', {direction: 'right'}, 700);
                                self.findFood = true;
                                self.addMessage($(this).text(), 'user', 'text');
                                $('#message_queue').animate({paddingBottom: '8px'}, 700);
                            });
                            break;
                        case 'wines':
                            jsonResponse.text.forEach(function (step) {
                                if (step.response_type === 'text') {
                                    self.messageQueue.push({value: step.text, sender: 'gaspar', type: 'text'});
                                } else if (step.response_type === 'option') {
                                    self.messageQueue.push({value: step.title, sender: 'gaspar', type: 'text'});
                                    step.options.forEach(function (option) {
                                        self.messageQueue.push({value: option, sender: 'gaspar', type: 'button'});
                                    });
                                }
                            });
                            self.messageQueue.push({value: jsonResponse.message, sender: 'gaspar', type: 'text'});
                            self.messageQueue.push({value: jsonResponse.data, sender: 'gaspar', type: 'carousel'});
                            self.flushQueue(self.messageQueue);
                            // self.postToAPI('Exit', true);
                            self.wines = 'true';
                            self.pairing = 'false';
                            break;
                        case 'pairing':
                            jsonResponse.text.forEach(function (step) {
                                if (step.response_type === 'text') {
                                    self.messageQueue.push({value: step.text, sender: 'gaspar', type: 'text'});
                                } else if (step.response_type === 'option') {
                                    self.messageQueue.push({value: step.title, sender: 'gaspar', type: 'text'});
                                    step.options.forEach(function (option) {
                                        self.messageQueue.push({value: option, sender: 'gaspar', type: 'button'});
                                    });
                                }
                            });
                            self.messageQueue.push({value: jsonResponse.message, sender: 'gaspar', type: 'text'});
                            self.wineList = jsonResponse.data;
                            self.messageQueue.push({value: jsonResponse.data, sender: 'gaspar', type: 'carousel'});
                            self.flushQueue(self.messageQueue);
                            // self.postToAPI('Exit', true);
                            self.pairing = 'true';
                            self.wines = 'false';
                            break;
                        case 'other':
                            jsonResponse.response.forEach(function (step) {
                                if (step.response_type === 'text') {
                                    self.messageQueue.push({value: step.text, sender: 'gaspar', type: 'text'});
                                } else if (step.response_type === 'option') {
                                    self.messageQueue.push({value: step.title, sender: 'gaspar', type: 'text'});
                                    step.options.forEach(function (option) {
                                        self.messageQueue.push({value: option, sender: 'gaspar', type: 'button'});
                                    });
                                }
                            });
                            self.flushQueue(self.messageQueue);
                            break;
                    }
                }
            });
        },
        showPreview: function (text) {
            let self = this;
            self.previewTimer = setTimeout(function () {
                $(containers.PREVIEW_CONTAINER).show('drop', {direction: 'down'}, 600);
            }, 10000);
            clearTimeout(self.previewTimer);
        },
        flushQueue: function (currentQueue) {
            let self = this;
            if (currentQueue.length > 0) {
                let currentElement = currentQueue.shift();
                setTimeout(() => {
                    $('#message_queue').animate({paddingBottom: '60px'}, 200);
                    self.scrollQuery(400);
                    $('#waves_message').show('drop', {'direction': 'left'}, 800);
                    setTimeout(() => {
                        $('#message_queue').animate({paddingBottom: '8px'}, 400);
                        $('#waves_message').hide('drop', {'direction': 'left'}, 300);
                        self.addMessage(currentElement.value, currentElement.sender, currentElement.type);
                        self.flushQueue(currentQueue);
                    }, self.type_timer);
                }, self.pause_timer);
            }
        },
        scrollQuery: function (timeout) {
            $(containers.QUEUE).animate({scrollTop: $(containers.QUEUE)[0].scrollHeight}, timeout);
        }
    };
    gaspar.initialize();
});