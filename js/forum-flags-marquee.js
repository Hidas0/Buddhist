(function () {
    var FORUM_COUNTRIES = [
        { code: 'in', name: 'Индия' },
        { code: 'cn', name: 'Китай' },
        { code: 'lk', name: 'Шри-Ланка' },
        { code: 'th', name: 'Таиланд' },
        { code: 'mm', name: 'Мьянма' },
        { code: 'kh', name: 'Камбоджа' },
        { code: 'np', name: 'Непал' },
        { code: 'mn', name: 'Монголия' },
        { code: 'bt', name: 'Бутан' },
        { code: 'vn', name: 'Вьетнам' },
        { code: 'la', name: 'Лаос' },
        { code: 'kr', name: 'Республика Корея' },
        { code: 'bd', name: 'Бангладеш' },
        { code: 'kz', name: 'Казахстан' },
        { code: 'uz', name: 'Узбекистан' },
        { code: 'tj', name: 'Таджикистан' },
        { code: 'kg', name: 'Киргизия' },
        { code: 'by', name: 'Белоруссия' },
        { code: 'es', name: 'Испания' },
        { code: 'de', name: 'Германия' },
        { code: 'rs', name: 'Сербия' },
        { code: 'br', name: 'Бразилия' },
        { code: 'ug', name: 'Уганда' },
        { code: 'my', name: 'Малайзия' },
        { code: 'ru', name: 'Россия', host: true }
    ];

    function buildGroup(countries, hidden) {
        var group = document.createElement('div');
        group.className = 'forum-flags-marquee__group';
        if (hidden) {
            group.setAttribute('aria-hidden', 'true');
        }

        var passes = 2;
        for (var p = 0; p < passes; p += 1) {
            countries.forEach(function (country) {
                var img = document.createElement('img');
                img.src = 'https://flagcdn.com/w80/' + country.code + '.png';
                img.alt = hidden ? '' : country.name;
                img.width = 80;
                img.height = 53;
                img.loading = 'lazy';
                img.decoding = 'async';
                img.draggable = false;
                if (country.host) {
                    img.dataset.host = 'true';
                    img.title = country.name + ' — принимающая страна';
                }
                group.appendChild(img);
            });
        }

        return group;
    }

    function initForumFlagsMarquee() {
        var track = document.querySelector('.forum-flags-marquee__track');
        if (!track || track.dataset.ready === 'true') {
            return;
        }

        track.appendChild(buildGroup(FORUM_COUNTRIES, false));
        track.appendChild(buildGroup(FORUM_COUNTRIES, true));
        track.dataset.ready = 'true';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForumFlagsMarquee);
    } else {
        initForumFlagsMarquee();
    }
})();
