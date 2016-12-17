/**
 * Created by Kuroky360 on 12/17/16.
 */
angular.module('dviz',[]).controller('timelineCtrl',['$scope',function($scope){
    $scope.config={
        data:[],
        dataExtent:[],
        fetchData:function(timeInterval){
            
        },
        brushSelection:function(brushExtent){
            //todo
        }
    };
}]);
angular.element(document).ready(function(){
    angular.bootstrap(document,['dviz']);
});