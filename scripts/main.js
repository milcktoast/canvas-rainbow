( function ( $, Three, undefined ) {

  var V3 = Three.Vector3;
  var M4 = Three.Matrix4;

  var $container, renderer;
  var $handleContainer;

  var ColorPoint = function ( position, color, context ) {
    this.position = position || new V3();
    this.color = color;
    this.context = context;
    this.setGradient( 10, 300 );

    this.$domElement = $('<div class="colorPoint">');
    this.$domElement.data( "colorPoint", this );
    this.$domElement.css({
      left: position.x,
      top: position.y
    });
  };

  ColorPoint.prototype = {
    setGradient: function ( radius0, radius1 ) {
      var gradient = this.context.createRadialGradient(
        this.position.x, this.position.y, 10,
        this.position.x, this.position.y, 500
      );

      gradient.addColorStop( 0, "rgba(" + this.color + ",1)" );
      gradient.addColorStop( 0.1, "rgba(" + this.color + ",0.2)");
      gradient.addColorStop( 1, "rgba(" + this.color + ",0)");
      this.gradient = gradient;
    }
  };

  var Renderer = function () {
    this.$domElement = $("<canvas>");
    this.context = this.$domElement.get( 0 ).getContext("2d");
    this.dimensions = new V3();
    this.center = new V3();
    this.mousePosition = new V3();
    this.colorPoints = [];
    this.colorPositions = [];
  };

  Renderer.prototype = {
    setSize: function ( width, height ) {
      this.center.set( width / 2, height / 2, 0 );
      this.dimensions.set( width, height, 0 );
      this.$domElement.attr({
        width: width,
        height: height
      });
    },

    addColorPoint: function ( position, color ) {
      var colorPoint = new ColorPoint( position, color, this.context );
      this.colorPoints.push( colorPoint );
      this.colorPositions.push( position );

      $handleContainer.append( colorPoint.$domElement );
    },

    setColorPoints: ( function () {
      var colors = [
        "255, 0, 0",
        "255, 150, 0",
        "233, 194, 0",
        "55, 220, 14",
        "10, 100, 220",
        "155, 20, 220"
      ];

      return function () {
        var xCount = 4;
        var yCount = 3;
        var width = $container.width();
        var height = $container.height();
        var position;
        var colorIndex = 0;

        for ( var x = 1; x < xCount; x ++ ) {
          for ( var y = 1; y < yCount; y ++ ) {
            position = new V3( width * x / xCount, height * y / yCount, 0 );
            this.addColorPoint( position, colors[colorIndex] );
            colorIndex ++;
          }
        }
      };
    }() ),

    lineFromPoints: function ( points ) {
      var ctx = this.context;
      ctx.beginPath();
      ctx.moveTo( points[0].x, points[0].y );

      var point;
      for ( var i = 1, il = points.length; i < il; i ++ ) {
        point = points[ i ];
        ctx.lineTo( point.x, point.y );
      }
      ctx.stroke();
    },

    curveFromPoints: function ( points ) {
      var ctx = this.context;
      var xcStart = ( points[0].x + points[1].x ) / 2;
      var ycStart = ( points[0].y + points[1].y ) / 2;
      var xc, yc;

      ctx.beginPath();
      ctx.moveTo( xcStart, ycStart );

      for ( var i = 1, il = points.length - 1; i < il; i ++ ) {
        xc = ( points[i].x + points[i + 1].x ) / 2;
        yc = ( points[i].y + points[i + 1].y ) / 2;
        ctx.quadraticCurveTo( points[i].x, points[i].y, xc, yc );
      }

      ctx.quadraticCurveTo( points[0].x, points[0].y, xcStart, ycStart );
      ctx.closePath();
      ctx.stroke();
    },

    getLoopPoints: ( function () {
      // var unitZ = new V3( 0, 0, 1 );
      var matrix = new M4();
      var rotate = new V3();
      var rotation = Math.PI / 2;
      var scale = 50;

      function applyTransforms ( v3 ) {
        matrix
          .setRotationFromEuler( rotate )
          .multiplyVector3( v3 );

        v3.multiplyScalar( scale );
      }

      return function ( targets ) {
        var points = [];
        var target, local, point1, point2;

        for ( var i = 0, il = targets.length; i < il; i ++ ) {
          target = targets[ i ];
          local = new V3().sub( target, this.mousePosition ).normalize();
          point1 = local.clone();
          point2 = local.clone();

          rotate.setZ( -rotation );
          applyTransforms( point1 );
          point1.addSelf( target );

          rotate.setZ( rotation );
          applyTransforms( point2 );
          point2.addSelf( target );

          points.push( point1, point2, this.mousePosition );
        }

        return points;
      };
    }() ),

    render: function () {
      var ctx = this.context;
      var curvePoints = this.getLoopPoints( this.colorPositions );

      ctx.save();
      // ctx.translate( this.center.x, this.center.y );
      for ( var i = 0, il = this.colorPoints.length; i < il; i ++ ) {
        ctx.scale( 0.99, 0.99 );
        ctx.strokeStyle = this.colorPoints[ i ].gradient;
        this.curveFromPoints( curvePoints );
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect( 0, 0, this.dimensions.x, this.dimensions.y );
    }
  };

  function onMouseMove ( event ) {
    renderer.mousePosition.set( event.pageX, event.pageY, 0 );
    renderer.render();
  }

  function onHandleDrag ( event, ui ) {
    $( this ).data("colorPoint").position.set( ui.position.left, ui.position.top, 0 );
  }

  function onHandleDragStop ( event, ui ) {
    $( this ).data("colorPoint").setGradient( 0, 300 );
  }

  function initialize () {
    $container = $("#canvasWrap");
    $handleContainer = $("#handleWrap");

    renderer = new Renderer();
    $container.append( renderer.$domElement );
    renderer.setSize( $container.width(), $container.height() );
    renderer.setColorPoints();

    $handleContainer.find('.colorPoint').draggable({
      containment: "parent",
      drag: onHandleDrag,
      stop: onHandleDragStop
    });
    $( document ).on( "mousemove", onMouseMove );
  }

  $( initialize );

}( jQuery, THREE ) );
