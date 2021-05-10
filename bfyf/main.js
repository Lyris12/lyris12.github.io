let baseURL = "https://raw.githubusercontent.com/LimitlessSocks/EXU-Scrape/master/";
// baseURL = "./";
window.ycgDatabase = baseURL + "ycg.json";
window.bfyfDatabase = baseURL + "bfyf.json";

let onLoad = async function () {
    // let response = await fetch(window.databaseToUse);
    // let db = await response.json();
    // CardViewer.Database.setInitial(db);
    await CardViewer.Database.initialReadAll(ycgDatabase, bfyfDatabase);
    CardViewer.firstTime = false;
    CardViewer.excludeTcg = false;
    
    // remove tcg non-imported
    for(let [id, card] of Object.entries(CardViewer.Database.cards)) {
        if(!card.custom && BFYF_CARD_IDS.indexOf(+id) === -1) {
            delete CardViewer.Database.cards[id];
        }
    }
    
    let b= true;
    CardViewer.composeStrategy = function composeWithTcg(card) {
        let k = CardViewer.composeResult(card);
        let ir = k.find(".img-result");
        if(!ir.attr("src")) {
            ir.attr("src", "https://www.duelingbook.com/images/low-res/" + card.id + ".jpg");
        }
        return k;
    };
    
    CardViewer.Elements.searchParameters = $("#searchParameters");
    
    CardViewer.Elements.cardType = $("#cardType");
    CardViewer.Elements.cardLimit = $("#cardLimit");
    CardViewer.Elements.cardAuthor = $("#cardAuthor");
    CardViewer.Elements.search = $("#search");
    CardViewer.Elements.results = $("#results");
    CardViewer.Elements.autoSearch = $("#autoSearch");
    CardViewer.Elements.cardName = $("#cardName");
    CardViewer.Elements.resultCount = $("#resultCount");
    CardViewer.Elements.cardDescription = $("#cardDescription");
    CardViewer.Elements.currentPage = $("#currentPage");
    CardViewer.Elements.pageCount = $("#pageCount");
    CardViewer.Elements.nextPage = $("#nextPage");
    CardViewer.Elements.previousPage = $("#previousPage");
    CardViewer.Elements.resultNote = $("#resultNote");
    CardViewer.Elements.cardId = $("#cardId");
    CardViewer.Elements.cardCategory = $("#cardCategory");
    CardViewer.Elements.cardVisibility = $("#cardVisibility");
    CardViewer.Elements.ifMonster = $(".ifMonster");
    CardViewer.Elements.ifSpell = $(".ifSpell");
    CardViewer.Elements.ifTrap = $(".ifTrap");
    CardViewer.Elements.ifLink = $(".ifLink");
    CardViewer.Elements.cardSpellKind = $("#cardSpellKind");
    CardViewer.Elements.cardTrapKind = $("#cardTrapKind");
    CardViewer.Elements.monsterStats = $("#monsterStats");
    CardViewer.Elements.spellStats = $("#spellStats");
    CardViewer.Elements.trapStats = $("#trapStats");
    CardViewer.Elements.cardLevel = $("#cardLevel");
    CardViewer.Elements.cardMonsterCategory = $("#cardMonsterCategory");
    CardViewer.Elements.cardMonsterAbility = $("#cardMonsterAbility");
    CardViewer.Elements.cardMonsterType = $("#cardMonsterType");
    CardViewer.Elements.cardMonsterAttribute = $("#cardMonsterAttribute");
    CardViewer.Elements.cardATK = $("#cardATK");
    CardViewer.Elements.cardDEF = $("#cardDEF");
    CardViewer.Elements.cardLevelCompare = $("#cardLevelCompare");
    CardViewer.Elements.cardATKCompare = $("#cardATKCompare");
    CardViewer.Elements.cardDEFCompare = $("#cardDEFCompare");
    CardViewer.Elements.toTopButton = $("#totop");
    CardViewer.Elements.saveSearch = $("#saveSearch");
    CardViewer.Elements.clearSearch = $("#clearSearch");
    
    CardViewer.Elements.search.click(CardViewer.submit);
    CardViewer.Elements.previousPage.click(CardViewer.Search.previousPage);
    CardViewer.Elements.nextPage.click(CardViewer.Search.nextPage);
    
    CardViewer.Elements.toTopButton.click(() => {
        $("html, body").animate(
            { scrollTop: "0px" },
            { duration: 200, }
        );
    });
    
    CardViewer.Elements.saveSearch.click(() => {
        let strs = [];
        for(let [key, value] of Object.entries(CardViewer.query())) {
            if(value !== "" && value !== "any" && key !== "imported" && key !== "notImported" && key !== "alsoImported") {
                if(key === "retrain" && !value) continue;
                if(key.indexOf("Compare") !== -1 && value === "equal") continue;
                strs.push(key + "=" + value);
            }
        }
        if(strs.length || window.location.search) {
            window.location.search = encodeURI(strs.join(","))
                .replaceAll(".", "%2E")
                .replaceAll(",", "%2C");
        }
    });
    
    const KeyToElement = {
        name:               CardViewer.Elements.cardName,
        effect:             CardViewer.Elements.cardDescription,
        type:               CardViewer.Elements.cardType,
        limit:              CardViewer.Elements.cardLimit,
        id:                 CardViewer.Elements.cardId,
        author:             CardViewer.Elements.cardAuthor,
        // retrain:         CardViewer.Elements.cardIsRetrain,
        category:           CardViewer.Elements.cardCategory,
        visibility:         CardViewer.Elements.cardVisibility,
        monsterType:        CardViewer.Elements.cardMonsterType,
        monsterAttribute:   CardViewer.Elements.cardMonsterAttribute,
        monsterCategory:    CardViewer.Elements.cardMonsterCategory,
        monsterAbility:     CardViewer.Elements.cardMonsterAbility,
        level:              CardViewer.Elements.cardLevel,
        levelCompare:       CardViewer.Elements.cardLevelCompare,
        atk:                CardViewer.Elements.cardATK,
        atkCompare:         CardViewer.Elements.cardATKCompare,
        def:                CardViewer.Elements.cardDEF,
        defCompare:         CardViewer.Elements.cardDEFCompare,
    };
    
    const parseStringValue = (str) => {
        if(str === "true" || str === "false") {
            return str === "true";
        }
        
        let tryInt = parseInt(str);
        if(!Number.isNaN(tryInt)) {
            return tryInt;
        }
        
        return str;
    }
    
    if(window.location.search) {
        let searchString = decodeURI(
            window.location.search.replaceAll("%2C", ",")
        )
        CardViewer.firstTime = false;
        let type = null;
        for(let pair of searchString.slice(1).split(",")) {
            pair = pair.replace(
                /%([0-9A-Fa-f]{2})/g,
                (_, $1) => String.fromCharCode(parseInt($1, 16))
            );
            let [ key, value ] = pair.split(/=(.+)?/);
            let el = KeyToElement[key];
            if(!el) {
                if(key === "kind") {
                    if(type === "spell") {
                        el = CardViewer.Elements.cardSpellKind
                    }
                    else {
                        el = CardViewer.Elements.cardTrapKind;
                    }
                }
                else if(key === "arrowMask") {
                    let buttons = $(".arrow-button");
                    let mask = parseInt(value, 2);
                    
                    for(let i = 0; i < flatArrow.length; i++) {
                        let subMask = flatArrow[i];
                        // console.log(subMask, i, flatArrow[i], mask);
                        if(subMask && (mask & subMask) === subMask) {
                            $(buttons[i]).toggleClass("toggled");
                        }
                    }
                    continue;
                }
                else if(key === "exactArrows") {
                    if(value === "true") {
                        $("#equals").toggleClass("toggled");
                    }
                    continue;
                }
                else if(key === "group" || key === "alsoImported") {
                    continue;
                }
            }
            value = parseStringValue(value);
            if(el.is("[type='checkbox']")) {
                el.prop("checked", value);
            }
            else {
                el.val(value);
            }
            if(key === "type") {
                type = value;
            }
        }
    }
    
    CardViewer.Elements.autoSearch.change(function () {
        CardViewer.autoSearch = this.checked;
    });
    CardViewer.Elements.autoSearch.change();
    
    CardViewer.setUpTabSearchSwitching();
    CardViewer.setUpArrowToggle();
    
    let allInputs = CardViewer.setUpAllInputs();
    
    // check if any input data
    for(let el of allInputs) {
        let hasValue = false;
        el = $(el);
        if(el.is("select")) {
            if(el.val() != el.children().first().val()) {
                hasValue = true;
            }
        }
        else if(el.is("input[type=checkbox]")) {
            console.log(el.attr("checked"));
            hasValue = el.is(":checked");
        }
        else {
            hasValue = el.val() != "";
        }
        if(hasValue) {
            CardViewer.firstTime = false;
            break;
        }
    }
    
    CardViewer.submit();
    
    let updateBackground = () => {
        if(localStorage.getItem("EXU_REDOX_MODE") === "true") {
            $("html").css("background-image", "url(\"" + getResource("bg", "godzilla") + "\")");
            $("html").css("background-size", "100% 100%");
        }
        else {
            $("html").css("background-image", "");
            $("html").css("background-size", "");
        }
    };
    
    $(window).keydown((ev) => {
        let orig = ev.originalEvent;
        if(ev.altKey && ev.key === "R") {
            let wasActive = localStorage.getItem("EXU_REDOX_MODE") === "true";
            localStorage.setItem("EXU_REDOX_MODE", !wasActive);
            updateBackground();
        }
    });
    
    updateBackground();
    
    const purposeFilter = $("#purposeFilter");
    
    for(let obj of Object.values(CardGroups)) {
        let { id, name, data } = obj;
        let button = $("<button>");
        button.text(name);
        button.click(() => {
            CardViewer.firstTime = false;
            CardViewer.Elements.resultNote.text("This is an incomplete list. You can help by finding new cards in this category that are semi-generic, that is, able to be used by more than 1 particular strategy.");
            CardViewer.demonstrate((card) => data.indexOf(card.id) !== -1);
        });
        button.contextmenu((e) => {
            window.location.search = "group=" + id;
            e.preventDefault();
        });
        button.toggle();
        purposeFilter.append(button);
        obj.button = button;
    }
    
    let match = window.location.search.match(/group=(\w+)/);
    if(match) {
        // console.log(match[1]);
        CardGroups[match[1]].button.click();
    }
    
    $("#expandPurpose, #contractPurpose").click(function () {
        $("#purposeFilter button").toggle();
    });
};

window.addEventListener("load", onLoad);