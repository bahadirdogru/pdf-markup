var settings = {
    format: 'a4',
    sizeMultiplier: 4,
    activeBorderColor: 'gray'
};

var formats = {
    a4: [210, 297]
};

var Markup = function(markupField, markupTools) {
    this.MarkupField = markupField;
    this.MarkupTools = markupTools;
    this.Elements = [];
    var plugins = [];
    var objectHandleId = 0;
    var activeElement = -1;

    var initMarkupField = function() {
        $(markupField)
            .on('click', function(){ ResetActiveElement(); })
            .css({
                width: SizeCalculator.ToPixels(formats[settings.format][0]) + 'px',
                height: SizeCalculator.ToPixels(formats[settings.format][1]) + 'px'
            });

        $(window).on('keyup', function(e) {
            if(e.keyCode == 46) {
                RemoveActiveElement();
            }
        });
    };

    var ClearObjects = function() {
        ResetActiveElement();

        for (var i in this.Elements) {
            if (this.Elements[i].Handle) {
                $('#' + this.Elements[i].Handle).remove();
            }
        }
    };

    var AddObjects = function() {
        ClearObjects();

        for (var i in this.Elements) {
            var elementObject = this.Elements[i];
            elementObject.Handle = "PDFMARKUP-" + ++objectHandleId;
            $(this.MarkupField).prepend('<div id="' + elementObject.Handle + '"></div>');
            $('#' + elementObject.Handle)
                .addClass('pdfmarkup-editable')
                .on('click', ActivateElementEvent)
                .css({
                    position: 'absolute',
                    border: '1px solid transparent',
                    top: elementObject.y,
                    left: elementObject.x,
                });

            if (plugins.length > 0) {
                for (var i in plugins) {
                    if (plugins[i].HandlesType(elementObject.type)) {
                        plugins[i].Paint(elementObject);
                    }
                }
            }
        }
    };
    
    var UpdatePositions = function() {
        if (this.Elements.length > 0) {
            for (var i in this.Elements) {
                this.Elements[i].x = Math.round(SizeCalculator.ToMM($('#' + this.Elements[i].Handle).position().left));
                this.Elements[i].y = Math.round(SizeCalculator.ToMM($('#' + this.Elements[i].Handle).position().top));
            }
        }
    };
    
    var MakeObjectsDraggable = function() {
        $(this.MarkupField).children().draggable({
            stop: function(event, ui) {
                UpdatePositions();
                SendUpdateEvent();
            }
        });
    };
    
    var ActivateElementByIndex = function(index) {
        if (activeElement != index) {
            ResetActiveElement();
            activeElement = index;
            
            if (this.Elements[activeElement]) {
                $('#' + this.Elements[activeElement].Handle).css({border: '1px solid ' + settings.activeBorderColor});
                SendActivateEvent();
            }
        }
    };
    
    var SendUpdateEvent = function() {
        if (this.Elements[activeElement]) {
            for (var i in plugins) {
                if (plugins[i].HandlesType(this.Elements[activeElement].type)) {
                    plugins[i].Update(this.Elements[activeElement]);
                    markupTools.Activate(this.Elements[activeElement], plugins[i]);
                }
            }
        }

        $(this).trigger('update');
    };
    
    var SendActivateEvent = function() {
        if (this.Elements[activeElement]) {
            for (var i in plugins) {
                if (plugins[i].HandlesType(this.Elements[activeElement].type)) {
                    markupTools.Activate(this.Elements[activeElement], plugins[i]);

                    if (plugins[i].Activate) {
                        plugins[i].Activate(this.Elements[activeElement]);
                    }
                }
            }
        }
    };

    var RemoveActiveElement = function() {
        this.RemoveElement(activeElement);
    };

    var escapeJSON = function(key, val) {
        if (typeof(val)!="string") return val;
        return val
            .replace(/[\\]/g, '\\\\')
            .replace(/[\/]/g, '\\/')
            .replace(/[\b]/g, '\\b')
            .replace(/[\f]/g, '\\f')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r')
            .replace(/[\t]/g, '\\t')
            .replace(/[\"]/g, '\\"')
            .replace(/\\'/g, "\\'");
    };

    this.AddPlugin = function(plugin) {
        plugins.push(plugin);
    };
    
    this.Refresh = function() {
        if (this.Elements.length > 0) {
            AddObjects();
            MakeObjectsDraggable();
        }
    };

    this.ActivateElement = function(handle) {
        if (this.Elements.length > 0) {
            for (var i in this.Elements) {
                if (this.Elements[i].Handle == handle) {
                    return ActivateElementByIndex(i);
                }
            }
        }
    };

    this.ActivateElementEvent = function(event) {
        event.stopPropagation();
        ActivateElement($(this).attr('id'));
    };
    
    this.ResetActiveElement = function() {
        if (this.Elements[activeElement]) {
            $('#' + this.Elements[activeElement].Handle).css({border: '1px solid transparent'});
        }

        activeElement = -1;
        markupTools.Deactivate();
    };
    
    this.AddElement = function(elementObject) {
        this.Elements.push(elementObject);
        this.Refresh();
        ActivateElementByIndex(this.Elements.length - 1);
        $(this).trigger('add');
    };

    this.RemoveElement = function(index) {
        ClearObjects();
        this.Elements.splice(index, 1);
        this.Refresh();
    };

    this.GetActiveElement = function() {
        if (activeElement >= 0) {
            return this.Elements[activeElement];
        }

        return null;
    };

    this.Serialize = function() {
        var result = JSON.parse(JSON.stringify(this.Elements, escapeJSON));

        for (var i in result) {
            if (result[i].Handle) {
                delete result[i].Handle;
            }

            if (result[i].properties) {
                delete result[i].properties;
            }
        }

        return result;
    };

    this.Load = function(data) {
        ClearObjects();

        for (var i in data) {
            window['Markup' + data[i]['type'][0].toUpperCase() + data[i]['type'].substr(1)].New(this);
            var element = this.Elements[this.Elements.length - 1];

            for (var j in data[i]) {
                element[j] = data[i][j];
            }
        }

        this.Refresh();
    };
    
    initMarkupField();
    return this;
};
