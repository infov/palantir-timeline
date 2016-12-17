/**
 * Created by Kuroky360 on 12/17/16.
 */
angular.module('dviz',[]).controller('timelineCtrl',['$scope',function($scope){
    //mockData;
    var mockData_1q=[
        {
            date:'2007-1',
            count:2000
        },
        {
            date:'2009-1',
            count:1500
        },
        {
            date: '2009-7',
            count:1200
        },
        {
            date:'2009-10',
            count:900
        },
        {
            date:'2010-10',
            count:700
        },
        {
            date:'2011-4',
            count:1400
        },
        {
            date:'2011-10',
            count:900
        },
        {
            date:'2015-1',
            count:800
        }
    ];

    $scope.config={
        data:mockData_1q,
        dataExtent:[+new Date(2007,0),+new Date(2015,0)],
        fetchData:fetchDataByTimeBin,
        brushSelection:angular.noop
    };

    function fetchDataByTimeBin(bin) {
        // mockData
        var mockData;
        switch (bin) {
            case "1q":
                mockData = mockData_1q;
                break;
            case "1M":
                break;
            case "15d":
                break;
            case "10d":
                break;
            case "4d":
                break;
            case "1d":
                break;
            case "12h":
                break;
            case "6h":
                break;
            case "1h":
                break;
            case "30m":
                break;
            case "10m":
                break;
            case "5m":
                break;
            case "1m":
                break;
            case "30s":
                break;
            case "10s":
                break;
            case "5s":
                break;
            case "2s":
                break;
            case "1s":
                break;
        }
    }
}]);
angular.element(document).ready(function(){
    angular.bootstrap(document,['dviz']);
});