/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the time-slider widget.
 *
 *     time-slider is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     time-slider is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with time-slider. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/* jshint browser:true white:true*/
/* globals TimeSlider links MashupPlatform StyledElements*/

(function () {

    "use strict";

    /** ****************************************************************************/
    /** ******************************* PUBLIC *************************************/
    /** ****************************************************************************/

    var TimeSlider = function TimeSlider(idContainer) {
        this.idContainer = idContainer;

        this.permanentMarks = {
            start: null,
            end: null
        };
        this.tiStart = {
            date: null,
            time: null
        };
        this.tiEnd = {
            date: null,
            time: null
        };

        this.markList = {};
        /*  markList = {
         *      "id": {
         *          "index": "",
         *          "value": {
         *              "start": ""
         *              "content": "",
         *          },
         *          "data": {}
         *      }
         *  };
         * */
        MashupPlatform.wiring.registerCallback("markInsertInput", handlerMarkInsertInput.bind(this));
        MashupPlatform.wiring.registerCallback("markSelectInput", handlerMarkSelectInput.bind(this));
        MashupPlatform.wiring.registerCallback("markDeleteInput", handlerMarkDeleteInput.bind(this));
        MashupPlatform.prefs.registerCallback(handlerPreferences.bind(this));
    };

    TimeSlider.prototype.init = function init() {
        var container = document.getElementById(this.idContainer);
        this.timeSlider = new links.Timeline(container);
        this.errorBoard = document.getElementById("errorBoard");
        this.controlPanel = document.getElementById("controlPanel");

        this.timeSliderOptions = {
            'minHeight': '150',
            'axisOnTop': true,
            'selectable': true,
            'cluster': true
        };
        this.dessapearTime = 10;

        setTimeSlider.call(this);
        setErrorBoard.call(this, "info", 'You can select "Start" or "End" and then drag them in order to stablish the limits.');
        setControlPanel.call(this);

        /* Context */
        MashupPlatform.widget.context.registerCallback(function (newValues) {
            if (this.timeSlider && ("heightInPixels" in newValues || "widthInPixels" in newValues)) {
                this.timeSlider.redraw();
            }
        }.bind(this));
    };

    /** ****************************************************************************/
    /** ******************************* PRIVATE ************************************/
    /** ****************************************************************************/

    var setTimeSlider = function setTimeSlider() {
        var now = new Date();
        // value = miliseconds * seconds * minutes * hours * days * months = around 1 year
        var value = (1000 * 60 * 60 * 24 * 31 * 12);

        this.permanentMarks.start = {
            start: new Date(now.getTime() - value),
            content: "Start",
            editable: "yes"
        };
        this.permanentMarks.end = {
            start: now,
            content: "End",
            editable: "yes"
        };

        var data = [];
        for (var mark in this.permanentMarks) {
            data.push(this.permanentMarks[mark]);
        }
        this.timeSlider.draw(data, this.timeSliderOptions);
        links.events.addListener(this.timeSlider, "change", handlerSendInterval.bind(this));
        links.events.addListener(this.timeSlider, "select", handlerClickMark.bind(this));
    };

    var setErrorBoard = function setErrorBoard(type, msg) {
        var typeList = {
            "success": {
                "icon": "icon-ok",
                "class": "alert alert-success"
            },
            "info": {
                "icon": "icon-info-sign",
                "class": "alert alert-info"
            },
            "warning": {
                "icon": "icon-warning-sign",
                "class": "alert"
            },
            "error": {
                "icon": "icon-minus-sign",
                "class": "alert alert-error"
            }
        };
        var icon = document.createElement("i");
        icon.setAttribute("class", typeList[type].icon);

        var span = document.createElement('span');
        span.textContent = msg;
        this.errorBoard.setAttribute("class", typeList[type].class);

        if (this.errorBoard.hasChildNodes()) {
            this.errorBoard.replaceChild(icon, this.errorBoard.childNodes[0]);
            this.errorBoard.replaceChild(span, this.errorBoard.childNodes[1]);
        } else {
            this.errorBoard.appendChild(icon);
            this.errorBoard.appendChild(span);
        }
        window.setTimeout(function () {
            this.errorBoard.classList.add("msgHide");
            span.classList.add("msgHide");
            icon.classList.add("msgHide");
        }, 1000 * this.dessapearTime);
    };

    var setControlPanel = function setControlPanel() {
        // Set now button
        var nowButton = new StyledElements.Button({
            text: 'Show Now'
        });
        nowButton.addEventListener("click", handlerNowButton.bind(this), false);
        nowButton.insertInto(this.controlPanel);

        // set show all button
        var showAllButton = new StyledElements.Button({
            text: 'Show Interval'
        });
        showAllButton.addEventListener("click", handlerShowAllButton.bind(this), false);
        showAllButton.insertInto(this.controlPanel);

        // set 24H button
        var show24h = new StyledElements.Button({
            text: '24H'
        });
        show24h.addEventListener("click", handlerShow24h.bind(this), false);
        show24h.insertInto(this.controlPanel);

        // set time interval
        var from = document.createElement('label');
        from.textContent = 'from:';
        this.controlPanel.appendChild(from);
        setDateTime.call(this, this.permanentMarks.start, this.tiStart);
        var to = document.createElement('label');
        to.textContent = 'to:';
        this.controlPanel.appendChild(to);
        setDateTime.call(this, this.permanentMarks.end, this.tiEnd);

        // show/hide images:
        var imageSpan = document.createElement("span");
        var imageIcon = document.createElement("i");
        imageIcon.className = "icon-eye-close";
        imageIcon.addEventListener("click", handlerClickIcon.bind(this));
        imageSpan.appendChild(imageIcon);
        this.controlPanel.appendChild(imageSpan);
    };

    var setDateTime = function setDateTime(mark, ti) {
        var handler = function handler(e) {
            var index = 0;
            var ti = this.tiStart;
            if (mark === this.permanentMarks.end) {
                index = 1;
                ti = this.tiEnd;
            }

            var date = ti.date.value.split("-");
            var year = parseInt(date[0], 10);
            var month = parseInt(date[1], 10) - 1;
            var day = parseInt(date[2], 10);
            var time = ti.time.value.split(":");
            var hour = parseInt(time[0], 10);
            var minute = parseInt(time[1], 10);
            var second = parseInt(time[2], 10);
            mark.start = new Date(year, month, day, hour, minute, second);
            this.timeSlider.changeItem(index, mark);
            showNewInterval.call(this, this.permanentMarks.start.start, this.permanentMarks.end.start);
        };

        var event = 'change';
        var date = getDateInput.call(this, mark.start);
        var time = getTimeInput.call(this, mark.start);

        ti.date = document.createElement('input');
        ti.date.setAttribute('type', 'date');
        ti.date.setAttribute('value', date);
        ti.date.addEventListener(event, handler.bind(this), false);
        this.controlPanel.appendChild(ti.date);

        ti.time = document.createElement('input');
        ti.time.setAttribute('type', 'time');
        ti.time.setAttribute('value', time);
        ti.time.addEventListener(event, handler.bind(this), false);
        this.controlPanel.appendChild(ti.time);
    };

    var changeIndexes = function changeIndexes(index) {
        var ids = Object.keys(this.markList);

        for (var j = 0; j < ids.length; j++) {
            if (this.markList[ids[j]].index > index) {
                this.markList[ids[j]].index -= 1;
            }
        }
    };

    /** ****************************** HANDLERS ************************************/

    // http://almende.github.io/chap-links-library/js/timeline/doc/jsdoc/symbols/links.Timeline.html
    var handlerMarkInsertInput = function handlerMarkInsertInput(markString) {
        var index;
        var mark = JSON.parse(markString);

        if (mark.id in this.markList) {     // Update
            index = this.markList[mark.id].index;
            var value = {
                'start': new Date(mark.start),
                'content': mark.content
            };
            if (mark.end) {
                value.end = mark.end;
            }
            this.markList[mark.id].value = value;
            this.markList[mark.id].data = mark.data;
            this.timeSlider.changeItem(index, value);
        } else {    // Insert
            index = Object.keys(this.markList).length + 2;
            if (mark.id && mark.start && mark.content && index) {
                this.markList[mark.id] = {
                    "index": index,
                    "value": {
                        "start": new Date(mark.start),
                        "content": mark.content
                    },
                    "data": mark.data
                };
                if (mark.end) {
                    this.markList[mark.id].value.end = new Date(mark.end);
                }
                this.timeSlider.addItem(this.markList[mark.id].value);
            } else {
                setErrorBoard.call(this, "error", "Input data was incorrect.");
            }
        }

        // Anyway, check if mark is inside the bounds.
        var item = this.markList[mark.id].value;
        var timeDateStart = this.permanentMarks.start.start;
        var timeDateEnd = this.permanentMarks.end.start;
        var timeDateItem = item.start;
        if (timeDateItem < timeDateStart || timeDateItem > timeDateEnd) {
            addClass.call(this, item, "shadow");
        } else {
            removeClass.call(this, item, "shadow");
        }
        this.timeSlider.changeItem(this.markList[mark.id].index, item);
    };

    var handlerMarkSelectInput = function handlerMarkSelectInput(markString) {
        var mark = JSON.parse(markString);
        if (mark.id in this.markList) {
            var index = this.markList[mark.id].index;
            this.timeSlider.unselectItem();
            this.timeSlider.selectItem(index);
        } else {
            setErrorBoard.call(this, "warning", "That mark can not be deleted because it does not exist.");
        }
    };

    var handlerMarkDeleteInput = function handlerMarkDeleteInput(markString) {
        var mark = JSON.parse(markString);
        if (mark.id in this.markList) {
            var index = this.markList[mark.id].index;
            this.timeSlider.deleteItem(index);
            delete this.markList[mark.id];
            changeIndexes.call(this, index);
        } else {
            setErrorBoard.call(this, "warning", "That mark can not be deleted because it does not exist.");
        }
    };

    var handlerSendInterval = function handlerSendInterval() {
        var startDateTime = this.permanentMarks.start.start;
        var endDateTime = this.permanentMarks.end.start;
        var startDate = getLocalDateInput.call(this, startDateTime);
        var startTime = getLocalTimeInput.call(this, startDateTime);
        var endDate = getLocalDateInput.call(this, endDateTime);
        var endTime = getLocalTimeInput.call(this, endDateTime);

        this.tiStart.date.value = startDate;
        this.tiStart.time.value = startTime;
        this.tiEnd.date.value = endDate;
        this.tiEnd.time.value = endTime;

        var dateInterval = startDate + "T" + startTime + "Z/"  + endDate + "T" + endTime + "Z";
        MashupPlatform.wiring.pushEvent("timeIntervalOutput", dateInterval);

        showNewInterval.call(this, startDate, endDate);
    };

    var handlerClickMark = function handlerClickMark() {
        var selectedMark = this.timeSlider.getSelection()[0].row;

        for (var mark in this.markList) {
            if (this.markList[mark].index === selectedMark) {
                MashupPlatform.wiring.pushEvent("selectedMarkOutput", JSON.stringify(this.markList[mark]));
                break;
            }
        }
    };

    var handlerPreferences = function handlerPreferences(preferences) {
        this.timeSliderOptions.cluster = preferences.clustering;
        this.dessapearTime = preferences.time;

        this.timeSlider.setOptions(this.timeSliderOptions);
        this.timeSlider.repaintNavigation();
    };

    var handlerNowButton = function handlerNowButton() {
        if (this.timeSlider) {
            this.timeSlider.setVisibleChartRangeNow();
        }
    };

    var handlerShowAllButton = function handlerShowAllButton() {
        if (this.timeSlider) {
            this.timeSlider.setVisibleChartRange(this.permanentMarks.start.start, this.permanentMarks.end.start);
        }
    };

    var handlerShow24h = function handlerShow24h() {
        var startDateTime = new Date((new Date()).getTime() - 12 * 60 * 60 * 1000);
        var endDateTime = new Date((new Date()).getTime() + 12 * 60 * 60 * 1000);
        var startDate = getLocalDateInput.call(this, startDateTime);
        var startTime = getLocalTimeInput.call(this, startDateTime);
        var endDate = getLocalDateInput.call(this, endDateTime);
        var endTime = getLocalTimeInput.call(this, endDateTime);

        this.tiStart.date.value = startDate;
        this.tiStart.time.value = startTime;
        this.tiEnd.date.value = endDate;
        this.tiEnd.time.value = endTime;

        this.permanentMarks.start.start = startDateTime;
        this.permanentMarks.end.start = endDateTime;

        this.timeSlider.changeItem(0, this.permanentMarks.start);
        this.timeSlider.changeItem(1, this.permanentMarks.end);
        showNewInterval.call(this, this.permanentMarks.start.start, this.permanentMarks.end.start);
        handlerShowAllButton.call(this);
    };

    var handlerClickIcon = function handlerClickIcon(e) {
        var itemList = this.timeSlider.getData();
        var j;
        for (var i = 0; i < itemList.length - 2; i++) {
            j = i + 2;
            toggleClass.call(this, itemList[j], "imageHidden");
            this.timeSlider.changeItem(j, itemList[j]);
        }

        e.currentTarget.classList.toggle("icon-eye-close");
        e.currentTarget.classList.toggle("icon-eye-open");
    };

/** ******************************** AUXILIAR *********************************/

    var getDateInput = function getDateInput(date) {
        return date.getUTCFullYear() + "-" + fixValue(date.getUTCMonth() + 1) + "-" + fixValue(date.getUTCDate());
    };

    var getTimeInput = function getTimeInput(date) {
        return fixValue(date.getUTCHours()) + ":" + fixValue(date.getUTCMinutes()) + ":" + fixValue(date.getUTCSeconds());
    };

    var getLocalDateInput = function getLocalDateInput(date) {
        return date.getFullYear() + "-" + fixValue(date.getMonth() + 1) + "-" + fixValue(date.getDate());
    };

    var getLocalTimeInput = function getLocalTimeInput(date) {
        return fixValue(date.getHours()) + ":" + fixValue(date.getMinutes()) + ":" + fixValue(date.getSeconds());
    };

    var fixValue = function fixValue(number) {
        return number < 10 ? "0" + number : number;
    };

    var showNewInterval = function showNewInterval(startDate, endDate) {
        var humanString = "From " + startDate.toLocaleString() + " to " + endDate.toLocaleString();
        setErrorBoard.call(this, "success", 'The time interval has been stablished. ' + humanString);
        changeOpacity.call(this);
    };

/** ******************************** Classes *********************************/

    var changeOpacity = function changeOpacity() {
        // Get list out of the limits:
        var timeDateItem = null;
        var itemList = this.timeSlider.getData();
        var timeDateStart = itemList[0].start;
        var timeDateEnd = itemList[1].start;

        var item;
        var j;
        for (var i = 0; i < itemList.length - 2; i++) {
            j = i + 2;    // correction factor, first 2 elements are Start and End.
            timeDateItem = itemList[j].start;
            item = itemList[j];

            if (timeDateItem < timeDateStart || timeDateItem > timeDateEnd) {
                addClass.call(this, item, "shadow");
            } else {
                removeClass.call(this, item, "shadow");
            }

            this.timeSlider.changeItem(j, item);
        }
    };

    var toggleClass = function toggleClass(item, styleClass) {
        var pattern = styleClass;
        var string = item.className;

        if (!string) {
            string = "";
        }
        if (string.search(pattern) < 0) {
            addClass.call(this, item, styleClass);
        } else {
            removeClass.call(this, item, styleClass);
        }
    };

    var addClass = function addClass(item, styleClass) {
        if (!item.className) {
            item.className = styleClass;
        } else if (item.className.search(styleClass) < 0) {
            item.className += " " + styleClass;
            item.className = item.className.trim();
        }
    };

    var removeClass = function removeClass(item, styleClass) {
        var pattern = styleClass;
        var string = item.className;

        if (string && string.search(pattern) > -1) {
            string = string.replace(pattern, "");
            string = string.trim();
            item.className = string;
        }
    };

    window.TimeSlider = TimeSlider;

})();

var timeSlider = new TimeSlider("timeSlider");

document.addEventListener("DOMContentLoaded", timeSlider.init.bind(timeSlider), false);
