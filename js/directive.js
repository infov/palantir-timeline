/**
 * Created by Kuroky360 on 12/17/16.
 */
angular.module('dviz').directive('palantirTimeline',['$timeout',function($timeout){
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="timeline-container"></div>',
        scope:{
            config: '=',
            fetchDataExtent:'=',
            fetchData:'=',
            callback:'='
        },
        link: function(scope, element) {
            var chart = d3.customCharts.timeline();
            $timeout(function(){
                var chartEl = d3.select(element[0]);
                element.parent().on('contextmenu',function(event){
                    event.preventDefault();
                });
                chart.width(element.width());
                chart.height(element.height()-10);
                chart.on('customDataFetch', function(req){
                    scope.fetchData(req.timeInterval,req.minDate,req.maxDate).then(function(data){
                        chart.refreshTimeline(data);
                    });
                });
                chart.on('customBrushSelection', function(brushExtent){
                    scope.callback(brushExtent);
                });
                scope.$watch('config', function () {
                    if(!scope.config) return;
                    scope.fetchDataExtent(scope.config).then(function(data){
                        var minDate,maxDate,xAxisMinDate,xAxisMaxDate,timeInterval,init;
                        if(data){
                            minDate=data.minDate;
                            maxDate=data.maxDate;
                            init=chart.getAppropriateDomainAndBinSize(minDate,maxDate);
                            xAxisMinDate=init.minDate;
                            xAxisMaxDate=init.maxDate;
                            timeInterval=init.timeInterval;
                            scope.fetchData(timeInterval,xAxisMinDate,xAxisMaxDate).then(function(data){
                                chartEl.datum(data).call(chart);
                            });
                        }
                    });
                },true);
            });
        }
    };
}]);