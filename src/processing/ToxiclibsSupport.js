toxi.processing = toxi.processing || {};

toxi.processing.ToxiclibsSupport = function(processing,optional_gfx){
	this.sketch = processing;
	console.log("sketch");
	console.log(this.sketch);
	console.log("p")
	console.log(this.sketch.p);
	this.app = processing;
	if(optional_gfx !== undefined){
		this.gfx = processing;
	} else {
		this.gfx = this.app;
	}
}

toxi.processing.ToxiclibsSupport.prototype = (function(){
	var normalMap = new toxi.Matrix4x4().translateSelf(128,128,128).scaleSelf(127);
	
	return {
		box: function(aabb,smooth){
			var mesh = aabb.toMesh();
			if(smooth === undefined){
				smooth = false;
			}
			if(smooth){
				mesh.computeVertexNormals();
			}
			this.mesh(mesh,smooth,0);
		},
		
		circle: function(p,radius){
			this.gfx.ellipse(p.x,p.y,radius,radius);
		},
		
		cone: function(){
			var cone = arguments[0],
				res = 6,
				thetaOffset = 0,
				topClosed = true,
				bottomClosed = true,
				smooth = false;
			if(arguments.length == 5){
				res = arguments[1];
				topClosed = arguments[2];
				bottomClosed = arguments[3];
				smooth = arguments[4];
			} else if(arguments.length == 3){
				res = arguments[1];
				smooth = arguments[2];
			}
			
			var mesh = cone.toMesh(new toxi.TriangleMesh(),res,thetaOffset,topClosed,bottomClosed);
			
			if(smooth){
				mesh.computeVertexNormals();
			}
			window.mesh = mesh;
			this.mesh(mesh,smooth,0);
		},
		
		cylinder: function(cyl,res,smooth){
			if(arguments.length == 1){
				this.mesh(cyl.toMesh(),false,0);
			} else {
				var mesh = cyl.toMesh(res,0);
				if(smooth === undefined){
					smooth = false;
				}
				if(smooth){
					mesh.computeVertexNormals();
				}
				this.mesh(mesh,smooth,0);
			}
		},
		
		ellipse: function(e){
			var r = e.getRadii();
			if(this.gfx.ellipseMode === this.app.CENTER){
				this.gfx.ellipse(e.x,e.y,r.x*2,r.y*2);
			} else if(this.gfx.ellipseMode === this.app.RADIUS){
				this.gfx.ellipse(e.x,e.y,r.x*2,r.y*2);
			} else if(this.gfx.ellipseMode === this.app.CORNER || this.gfx.ellipseMode === this.app.CORNERS){
				this.gfx.ellipse(e.x-r.x,e.y-r.y,r.x*2,r.y*2);
			}
		},
		
		getGraphics: function(){
			return this.gfx;
		},
		
		line: function(){
			var a = undefined,
				b = undefined;
			if(arguments.length == 1){
				var line = arguments[0];
				a = line.a;
				b = line.b;
			} else {
				a = arguments[0],
				b = arguments[1];
			}
			
			if(a.z === undefined){
				this.gfx.line(a.x,a.y,b.x,b.y);
			} else {
				this.gfx.line(a.x,a.y,a.z,b.x,b.y,b.z);
			}
		},
		
		lineStrip2D: function(points){
			var isFilled = this.fill; //TODO <-- verify how this works!
			this.gfx.fill = false;
			this.processVertices2D(points,this.app.POLYGON,false);
			this.gfx.fill = isFilled;
		},
		
		lineStrip3D: function(points){
			var isFilled = this.gfx.fill;
			this.gfx.fill = false;
			this.processVertices3D(points,this.app.POLYGON,false);
			this.gfx.fill = isFilled;
		},
		
		mesh: function(mesh,smooth,normalLength){
			if(smooth === undefined){
				smooth = false;
			}
			if(normalLength === undefined){
				normalLength = 0;
			}
			
			this.gfx.beginShape(this.app.TRIANGLES);
			var i= 0,
				len = mesh.faces.length;
			if(smooth){
				for(i=0;i<len;i++){
					var f = mesh.faces[i];
					this.gfx.normal(f.a.normal.x,f.a.normal.y,f.a.normal.z);
					this.gfx.vertex(f.a.x,f.a.y,f.a.z);
					this.gfx.normal(f.b.normal.x,f.b.normal.y,f.b.normal.z);
					this.gfx.vertex(f.b.x,f.b.y,f.b.z);
					this.gfx.normal(f.c.normal.x,f.c.normal.y,f.c.normal.z);
					this.gfx.vertex(f.c.x,f.c.y,f.c.z);
				}
			} else {
				for(var i=0;i<len;i++){
					var f = mesh.faces[i];
					this.gfx.normal(f.normal.x,f.normal.y,f.normal.z);
					this.gfx.vertex(f.a.x,f.a.y,f.a.z);
					this.gfx.vertex(f.b.x,f.b.y,f.b.z);
					this.gfx.vertex(f.c.x,f.c.y,f.c.z);
				}
			}
			this.gfx.endShape();
			if(normalLength > 0){
				var strokeCol = 0;
				var isStroked = this.gfx.stroke;  //TODO <-- verify this works!
				if(isStroked){
					strokeCol = this.gfx.strokeColor;
				}
				len = mesh.vertices.length;
				if(smooth){
					for(i=0;i<len;i++){
						var v = mesh.vertices[i],
							w = v.add(v.normal.scale(normalLength));
							n = v.normal.scale(127);
						this.gfx.stroke(n.x + 128, n.y + 128, n.z + 128);
						this.gfx.line(v.x,v.y,v.z,w.x,w.y,w.z);
					}
				} else {
					var third = 1 / 3;
					len = mesh.faces.length;
					for(i=0;i<len;i++){
						var f = mesh.faces[i],
							c = f.a.add(f.b).addSelf(f.c).scaleSelf(third),
							d = c.add(f.normal.scale(normalLength)),
							n = f.normal.scale(127);
						this.gfx.stroke(n.x+128,n.y+128,n.z+128);
						this.gfx.line(c.x,c.y,c.z,d.x,d.y,d.z);
					}
				}
				if(isStroked){
					this.gfx.stroke(strokeCol);
				} else {
					this.gfx.noStroke();
				}
			}
		},
		
		meshNormalMapped: function(mesh,vertexNormals,normalLength){
			this.gfx.beginShape(this.app.TRIANGLES);
			var i =0,
				len = mesh.faces.length;
			if(vertexNormals){
				for(i=0;i<len;i++){
					var f = mesh.faces[i],
						n = normalMap.applyTo(f.a.normal);
					this.gfx.fill(n.x,n.y,n.z);
					this.gfx.normal(f.a.normal.x,f.a.normal.y,f.a.normal.z);
					this.gfx.vertex(f.a.x,f.a.y,f.a.z);
					n = normalMap.applyTo(f.b.normal);
					this.gfx.fill(n.x,n.y,n.z);
					this.gfx.normal(f.b.normal.x,f.b.normal.y,f.b.normal.z);
					this.gfx.vertex(f.b.x,f.b.y,f.b.z);
					n = normalMap.applyTo(f.c.nromal);
					this.gfx.fil(n.x,n.y,n.z);
					this.gfx.normal(f.c.normal.x,f.c.normal.y,f.c.normal.z);
					this.gfx.vertex(f.c.x,f.c.y,f.c.z);
				}
			} else {
				for(i = 0;i<len;i++){
					var f = mesh.faces[i];
					this.gfx.normal(f.normal.x,f.normal.y,f.normal.z);
					this.gfx.vertex(f.a.x,f.a.y,f.a.z);
					this.gfx.vertex(f.b.x,f.b.y,f.b.z);
					this.gfx.vertex(f.c.x,f.c.y,f.c.z);
				}
			}
			this.gfx.endShape();
			if(normalLength > 0){
				if(vertexNormals){
					len = mesh.vertices.length;
					for(i=0;i<len;i++){
						var v = mesh.vertices[i],
							w = v.add(v.normal.scale(normalLength)),
							n = v.normal.scale(127);
						this.gfx.stroke(n.x+128,n.y+128,n.z+128);
						this.gfx.line(v.x,v.y,v.z,w.x,w.y,w.z);
					}
				} else {
					len = mesh.faces.length;
					for(i=0;i<len;i++){
						var f = mesh.faces[i],
							c = f.getCentroid(),
							d = c.add(f.normal.scale(normalLength)),
							n = f.normal.scale(127);
						this.gfx.stroke(n.x+128,n.y+128,n.z+128);
						this.gfx.line(c.x,c.y,c.z,d.x,d.y,d.z);
					}
				}
			}
		},
		
		origin: function(){
			var o = undefined, len = undefined;
			if(arguments.length == 1){
				len = arguments[0];
				o = toxi.Vec3D.ZERO;
			} else {
				o = arguments[0];
				len = arguments[1];
			}
			
			this.gfx.stroke(255,0,0);
			this.gfx.line(o.x,o.y,o.z,o.x+len,o.y,o.z);
			this.gfx.stroke(0,255,0);
			this.gfx.line(o.x,o.y,o.z,o.x,o.y+len,o.z);
			this.gfx.stroke(0,0,255);
			this.gfx.line(o.x,o.y,o.z,o.x,o.y,o.z+len);
		},
		
		plane: function(plane,size){
			this.mesh(plane.toMesh(size),false,0);
		},
		
		point: function(p){
			if(p.z === undefined){
				this.gfx.point(p.x,p.y);
			} else {
				this.gfx.point(p.x,p.y,p.z);
			}
		},
		
		//TODO should be one for iterator?
		points2D: function(points){
			this.processVertices2D(points,this.app.POINTS,false);
		},
		//TODO should be one for iterator?
		points3D: function(points){
			this.processVertices3D(points,this.app.POINTS,false);
		},
		
		polygon2D: function(poly){
			this.processVertices2D(poly.vertices,this.app.POLYGON,true);
		},
		//TODO points should be iterator
		processVertices2D: function(points, shapeID, closed){
			this.gfx.beginShape(shapeID);
			var i=0,
				len = points.length;
			for(i=0;i<len;i++){
				var v = points[i];
				this.gfx.vertex(v.x,v.y);
			}
			if(closed){
				this.gfx.endShape(this.app.CLOSE);
			} else {
				this.gfx.endShape();
			}
		},
		
		//TODO points should be iterator
		processVertices3D: function(points,shapeID,closed){
			this.gfx.beginShape(shapeID);
			var i=0,
				len = points.length;
			for(i=0;i<len;i++){
				var v = points[i];
				this.gfx.vertex(v.x,v.y,v.z);
			}
			if(closed){
				this.gfx.endShape(this.app.CLOSE);
			} else {
				this.gfx.endShape();
			}
		},
		
		ray: function(ray, length){
			var e = ray.getPointAtDistance(length);
			if(ray.z === undefined){
				this.gfx.line(ray.x,ray.y,e.x,e.y);
			} else {
				this.gfx.line(ray.x,ray.y,ray.z,e.x,e.y,e.z);
			}
		},
		
		rect: function(r){
			if(this.gfx.rectMode === this.app.CORNER){
				this.gfx.rect(r.x,r.y,r.width,r.height);
			} else if(this.gfx.rectMode === this.app.CORNERS){
				this.gfx.rect(r.x,r.y,r.x+r.width,r.y+r.height);
			} else if(this.gfx.rectMode === this.app.CENTER){
				this.gfx.rect(r.x+r.widt*0.5,r.y+r.height*0.5,r.width,r.height);
			} else if(this.gfx.rectMode === this.app.RADIUS){
				var rw = r.width * 0.5,
					rh = r.height *0.5;
				this.gfx.rect(r.x+rw,r.y+rh,rw,rh);
			}
		},
		
		setGraphics: function(gfx){
			this.gfx = gfx;
		},
		sphere: function(sphere, res,smooth){
			this.mesh(sphere.toMesh(res), smooth);
		},
		texturedMesh: function(mesh,tex,smooth){
			this.gfx.beginShape(this.app.TRIANGLES);
			this.gfx.texture(tex);
			var i =0,
				len = mesh.faces.length;
			if(smooth){
				for(i=0;i<len;i++){
					var f = mesh.faces[i];
					if(f.uvA !== undefined && f.uvB !== undefined && f.uvC !== undefined){
						this.gfx.normal(f.a.normal.x, f.a.normal.y, f.a.normal.z);
                    	this.gfx.vertex(f.a.x, f.a.y, f.a.z, f.uvA.x, f.uvA.y);
                    	this.gfx.normal(f.b.normal.x, f.b.normal.y, f.b.normal.z);
                    	this.gfx.vertex(f.b.x, f.b.y, f.b.z, f.uvB.x, f.uvB.y);
                    	this.gfx.normal(f.c.normal.x, f.c.normal.y, f.c.normal.z);
                    	this.gfx.vertex(f.c.x, f.c.y, f.c.z, f.uvC.x, f.uvC.y);
                	} else {
                    	this.gfx.vertex(f.a.x, f.a.y, f.a.z);
                    	this.gfx.vertex(f.b.x, f.b.y, f.b.z);
                    	this.gfx.vertex(f.c.x, f.c.y, f.c.z);
					}
				}
			} else {
				for(i=0;i<len;i++){
					var f= mesh.faces[i];
					this.gfx.normal(f.normal.x,f.normal.y,f.normal.z);
					if(f.uvA !== undefined && f.uvB !== undefined && f.uvC !== undefined){
						this.gfx.vertex(f.a.x, f.a.y, f.a.z, f.uvA.x, f.uvA.y);
                    	this.gfx.vertex(f.b.x, f.b.y, f.b.z, f.uvB.x, f.uvB.y);
                    	this.gfx.vertex(f.c.x, f.c.y, f.c.z, f.uvC.x, f.uvC.y);
                	} else {
                    	this.gfx.vertex(f.a.x, f.a.y, f.a.z);
                    	this.gfx.vertex(f.b.x, f.b.y, f.b.z);
                    	this.gfx.vertex(f.c.x, f.c.y, f.c.z);
					}
				}
			}
			this.gfx.endShape();
		},
		
		//works for toxi.Triangle or toxi.Triangle2D
		triangle: function(tri,isFullShape){
			if(isFullShape || isFullShape === undefined){
				this.gfx.beginShape(this.app.TRIANGLES);
			}
			var n = tri.computeNormal();
			this.gfx.normal(n.x,n.y,n.z);
			this.gfx.vertex(tri.a.x, tri.a.y, tri.a.z);
        	this.gfx.vertex(tri.b.x, tri.b.y, tri.b.z);
        	this.gfx.vertex(tri.c.x, tri.c.y, tri.c.z);
        	if(isFullShape || isFullShape === undefined){
        		this.gfx.endShape();
        	}
		},
		
		vertex: function(v){
			if(v.z === undefined){
				this.gfx.vertex(v.x,v.y);
			} else {
				this.gfx.vertex(v.x,v.y,v.z);
			}
		}
	};
})();