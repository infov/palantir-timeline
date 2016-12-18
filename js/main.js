/**
 * Created by Kuroky360 on 12/17/16.
 */
angular.module('dviz',[]).controller('timelineCtrl',['$scope','dataService',function($scope,dataService){
    //mockData;
    $scope.config={
        data:dataService.MockData['1q'],
        dataExtent:[+new Date(2007,0),+new Date(2015,0)],
        fetchData:fetchDataByTimeBin,
        brushSelection:angular.noop
    };

    function fetchDataByTimeBin(bin) {
        return dataService.get(bin);
    }
}]);
angular.element(document).ready(function(){
    angular.bootstrap(document,['dviz']);
});