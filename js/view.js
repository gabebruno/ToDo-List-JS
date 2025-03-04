/*global qs, qsa, $on, $parent, $live */

(function (window) {
    'use strict';

    /**
     * View that abstracts away the browser's DOM completely.
     * It has two simple entry points:
     *
     *   - bind(eventName, handler)
     *     Takes a todo application event and registers the handler
     *   - render(command, parameterObject)
     *     Renders the given command with the options
     */
    function View(template) {
        this.template = template;

        this.ENTER_KEY = 13;
        this.ESCAPE_KEY = 27;

        this.$todoList = qs('#todo-list');
        this.$todoItemCounter = qs('#todo-count');
        this.$main = qs('#main');
        this.$footer = qs('#footer');
        this.$newTodo = qs('#new-todo');
    }

    View.prototype._removeItem = function (id) {
        var elem = qs('[data-id="' + id + '"]');

        if (elem) {
            this.$todoList.removeChild(elem);
        }
    };

    View.prototype._setFilter = function (currentPage) {
        qs('#filters .selected').className = '';
        qs('#filters [href="#/' + currentPage + '"]').className = 'selected';
    };

    View.prototype._editItem = function (id, title) {
        var listItem = qs('[data-id="' + id + '"]');
        if (!listItem) {
            return;
        }

        listItem.className = listItem.className + ' editing';

        var input = document.createElement('input');
        input.className = 'edit';

        listItem.appendChild(input);
        input.focus();
        input.value = title;
    };

    View.prototype._editMarkItem = function (id, mark) {
            
        var listItem = qs('[data-id="' + id + '"]');
        
        if (!listItem) {
            return;
        }
        listItem.className = mark === true ? listItem.className = ' conclude' : listItem.className.replace('conclude', '');
    };

    View.prototype._editItemDone = function (id, title) {
        var listItem = qs('[data-id="' + id + '"]');

        if (!listItem) {
            return;
        }

        var input = qs('input.edit', listItem);
        listItem.removeChild(input);

        listItem.className = listItem.className.replace('editing', '');

        qsa('label', listItem).forEach(function (label) {
            label.textContent = title;
        });
    };

    View.prototype.render = function (viewCmd, parameter) {
        var that = this;
        var viewCommands = {
            showEntries: function () {
                that.$todoList.innerHTML = that.template.show(parameter);
            },
            removeItem: function () {
                that._removeItem(parameter);
            },
            updateElementCount: function () {
                that.$todoItemCounter.innerHTML = that.template.itemCounter(parameter);
            },
            contentBlockVisibility: function () {
                that.$main.style.display = that.$footer.style.display = parameter.visible ? 'block' : 'none';
            },
            setFilter: function () {
                that._setFilter(parameter);
            },
            clearNewTodo: function () {
                that.$newTodo.value = '';
            },
            editItem: function () {
                that._editItem(parameter.id, parameter.title);
            },
            editItemDone: function () {
                that._editItemDone(parameter.id, parameter.title);
            },
            markItem: function() {
                that._editMarkItem(parameter.id, parameter.mark)
            }
        };

        viewCommands[viewCmd]();
    };

    View.prototype._itemId = function (element) {
        var li = $parent(element, 'li');
        return parseInt(li.dataset.id, 10);
    };

    View.prototype._bindItemEditDone = function (handler) {
        var that = this;
        $live('#todo-list li .edit', 'blur', function () {
            if (!this.dataset.iscanceled) {
                handler({
                    id: that._itemId(this),
                    title: this.value
                });
            }
        });

        $live('#todo-list li .edit', 'keypress', function (event) {
            if (event.keyCode === that.ENTER_KEY) {
                // Remove the cursor from the input when you hit enter just like if it
                // were a real form
                this.blur();
            }
        });
    };

    View.prototype._bindItemMark = function (handler) {
        var that = this;
        $live('#todo-list .finish', 'click', function ()
        {
            handler({
                id: that._itemId(this),
                mark: this.value,
            });
        })

    };

    View.prototype._bindItemEditCancel = function (handler) {
        var that = this;
        $live('#todo-list li .edit', 'keyup', function (event) {
            if (event.keyCode === that.ESCAPE_KEY) {
                this.dataset.iscanceled = true;
                this.blur();

                handler({id: that._itemId(this)});
            }
        });
    };

    View.prototype.bind = function (event, handler) {
        var that = this;
        if (event === 'newTodo') {
            $on(that.$newTodo, 'change', function () {
                handler(that.$newTodo.value);
            });

        } else if (event === 'itemEdit') {
            $live('#todo-list li label', 'dblclick', function () {
                handler({id: that._itemId(this)});
            });

        } else if (event === 'itemRemove') {
            $live('#todo-list .destroy', 'click', function () {
                handler({id: that._itemId(this)});
            });

        } else if (event === 'itemMark') {
            $live('#todo-list .finish', 'click', function () {
                handler({id: that._itemId(this)});
            });

        } else if (event === 'itemEditDone') {
            that._bindItemEditDone(handler);

        } else if (event === 'itemEditCancel') {
            that._bindItemEditCancel(handler);
        }
    };

    // Export to window
    window.app = window.app || {};
    window.app.View = View;
}(window));
