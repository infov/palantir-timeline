/**
 * Created by Kuroky360 on 12/17/16.
 */
angular.module('dviz').directive('palantirTimeline',['$timeout',function($timeout){
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="timeline-container"></div>',
        scope:{
            config: '='
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
                    scope.fetchData(req.timeInterval).then(function(data){
                        chart.refreshTimeline(data);
                    });
                });
                chart.on('customBrushSelection', function(brushExtent){
                    scope.brushSelection(brushExtent);
                });
                scope.$watch('config', function () {
                    if(!scope.config) return;
                    scope.fetchData=scope.config.fetchData;
                    scope.brushSelection=scope.config.brushSelection;
                    var dataExtent=scope.config.dataExtent;
                    chart.domainAndBinsize(dataExtent[0],dataExtent[1]);
                    chartEl.datum(scope.config.data).call(chart);
                },true);
            });
        }
    };
}]);