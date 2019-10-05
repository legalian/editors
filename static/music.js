
var justice = new AppViewModel();

function drawEdge(selected,doucided,a,b,darcolor) {
  if (darcolor == null) {darcolor = "black"}
  var sl = Math.sqrt((a.y-b.y)*(a.y-b.y)+(a.x-b.x)*(a.x-b.x));
  var x0 = b.x + (a.y-b.y)*10/sl + (a.x-b.x)*20/sl;
  var y0 = b.y - (a.x-b.x)*10/sl + (a.y-b.y)*20/sl;
  var x1 = b.x - (a.y-b.y)*10/sl + (a.x-b.x)*20/sl;
  var y1 = b.y + (a.x-b.x)*10/sl + (a.y-b.y)*20/sl;
  var arrow = "<polyline points='"+x1+","+y1+" "+b.x+","+b.y+" "+x0+","+y0+"' fill='"+darcolor+"' stroke='white' stroke-width='5=2' closed='true'/>";
  var ostyle = "stroke-width='2'";
  if (selected) {
    ostyle = "stroke-width='5' stroke-dasharray='5,5'";
  }
  if (doucided) {
    var dx = (a.y-b.y)*.1 + (a.x+b.x)*.5;
    var dy = (a.y+b.y)*.5 - (a.x-b.x)*.1;
    return "<path d='M "+a.x+" "+a.y+" Q "+dx+" "+dy+" "+b.x+" "+b.y+"' fill='none' stroke='white' stroke-width='5' /> \
            <path d='M "+a.x+" "+a.y+" Q "+dx+" "+dy+" "+b.x+" "+b.y+"' fill='none' stroke='"+darcolor+"' "+ostyle+"/>"+arrow;
  } else {
    return "<line x1='"+a.x+"' x2='"+b.x+"' y1='"+a.y+"' y2='"+b.y+"' stroke='white' stroke-width='5'/> \
            <line x1='"+a.x+"' x2='"+b.x+"' y1='"+a.y+"' y2='"+b.y+"' stroke='"+darcolor+"' "+ostyle+"/>"+arrow;
  }
}

function Edge(a,b) {
  var self = this;
  self.a = a;
  self.b = b;
  self.isedge = true;
  self.weight = ko.observable(50);
  self.octavechange = ko.observable(0);
  self.doucided = ko.observable(false);
  self.selected = ko.observable(false);
  self.editingname = ko.observable(false);
  self.name = ko.computed(function() {
    return self.a.name()+"->"+self.b.name();
  });
  self.beginEditName = function() {};
  self.svg = ko.computed(function() {
    var a = self.a.pos();
    var b = self.b.pos();
    var amt = scalevec(justice.radius(),normalize(subtractvec(a,b)))
    var c = addvec(b,amt);
    var d = subtractvec(a,amt);
    var darcolor = "black";
    if (self.octavechange()>0) {darcolor = "#800000";}
    if (self.octavechange()<0) {darcolor = "#003366";}
    return drawEdge(self.selected(),self.doucided(),c,d,darcolor);
  });
  self.disto = function(pos) {
    var a = self.a.pos();
    var b = self.b.pos();
    var amt = scalevec(justice.radius(),normalize(subtractvec(a,b)))
    var c = addvec(b,amt);
    var d = subtractvec(a,amt);

    if (self.doucided()) {
      var k = {'x':(c.y-d.y)*.1 + (c.x+d.x)*.5,'y':(c.y+d.y)*.5 - (c.x-d.x)*.1};
      var djdj = Math.sqrt(dist2quadratic(pos,c,k,d));
      return djdj

    } else {
      return Math.sqrt(dist2line(pos,c,d));
    }
  };
};

function Node(name,x,y) {
  var self = this;
  self.name = ko.observable(name);
  self.editingname = ko.observable(false);
  self.isedge = false;
  self.selected = ko.observable(false);
  self.x = ko.observable(x);
  self.y = ko.observable(y);
  self.pos = function() {return {'x':self.x(),'y':self.y()};}

  self.beginEditName = function() {
    self.editingname(true);
    $("body").on("click", function(){
      self.editingname(false);
      $("body").off("click");
    });
  };
  self.svg = ko.computed(function() {
    var stwidth = '3';
    if (self.selected()) {stwidth = '6';}
    return "\
      <circle cx='"+self.x()+"' cy='"+self.y()+"' r='"+justice.radius()+"' fill='white' stroke='black' stroke-width='"+stwidth+"'/>\
      <text x='"+self.x()+"' y='"+self.y()+"' text-anchor='middle' fill='black' font-size='20px' font-family='Arial' dy='.3em'>"+self.name()+"</text>";
  });
  self.disto = function(pos) {
    return Math.sqrt(dist2(self.pos(),pos))-justice.radius();
  };
};


//remember which tool youre on and display it to the user
//allow the user to edit which notes are in each chord, maybe specify which one is the root
//save and load data
//make the delete button work



function AppViewModel() {
  var self = this;
  self.activelayer = ko.observable(null);
  self.nodes = ko.observableArray([]);
  self.edges = ko.observableArray([]);
  self.pos = null;
  self.spos = ko.observable(null);
  self.mode = "edit";
  self.radius = ko.observable(30);

  self.svg = ko.computed(function() {
    var res = "";
    self.nodes().forEach(function(item){
      res = item.svg() + res;
    });
    self.edges().forEach(function(item){
      res = item.svg() + res;
    });
    //add the edge that youre currently drawing...
    if (self.mode == 'draw' && self.spos()!=null && self.activelayer()!= null && !self.activelayer().isedge) {
      var amt = scalevec(self.radius(),normalize(subtractvec(self.spos(),self.activelayer().pos())))
      var c = addvec(self.activelayer().pos(),amt);
      console.log(amt,c);
      res = res + drawEdge(true,false,c,self.spos());
    }
    return res;
  });
  self.activelayer.subscribe(function(){
    //update all paths and nodes that believe they are selected...

    self.nodes().forEach(function(item){
      item.selected(item == self.activelayer());
    });
    self.edges().forEach(function(item){
      item.selected(item == self.activelayer());
    });
  });
  self.edges.subscribe(function() {
    //update all edges that believe they are shared...
    self.edges().forEach(function(item1){
      var duplicate = false;
      self.edges().forEach(function(item2){
        if (item1.a == item2.b && item2.a == item1.b) {duplicate=true;}
      });
      item1.doucided(duplicate);
    });
  })
  draginside($("#target"),function(x,y){
    self.spos(null);
    self.pos = {'x':x,'y':y};
    var closest = null;
    var heur = 9999999;
    self.nodes().forEach(function(item){
      var h = item.disto(self.pos);
      if (h<heur) {
        heur = h;
        closest = item;
      }
    });
    self.edges().forEach(function(item){
      var h = item.disto(self.pos);
      if (h<heur) {
        heur = h;
        closest = item;
      }
    });
    self.activelayer(null);
    if (heur<8) {
      if (self.mode == 'delete') {
        self.nodes.remove(closest);
        self.edges.remove(closest);
        for (var i=self.edges().length-1;i>=0;i--) {
          if (self.edges()[i].a == closest || self.edges()[i].b == closest) {
            self.edges.remove(self.edges()[i]);
          }
        }
      } else {
        self.activelayer(closest);
      }
    } else if (self.mode == 'add') {
      var i = new Node('new',x,y);
      self.nodes.push(i);
      self.activelayer(i);
    }
  },function(x,y){
    if (self.activelayer()==null) {return}
    if (!self.activelayer().isedge) {
      if (self.mode == 'draw') {
        self.spos({'x':x,'y':y});
      } else {
        self.activelayer().x(self.activelayer().x()+x-self.pos.x);
        self.activelayer().y(self.activelayer().y()+y-self.pos.y);
        self.pos = {'x':x,'y':y};
      }
    }
  },function(x,y){
    var pos = {'x':x,'y':y};
    if (self.mode == 'draw') {
      var closest = null;
      var heur = 9999999;
      self.nodes().forEach(function(item){
        var h = item.disto(pos);
        if (h<heur) {
          heur = h;
          closest = item;
        }
      });
      if (heur<8 && closest != self.activelayer()) {
        //if edge already exists, don't add...
        //dont add an edge to yourself...
        var valid = true;
        self.edges().forEach(function(item){
          if (item.a == closest && item.b == self.activelayer()) {valid=false;}
        });
        if (valid) {
          var nedg = new Edge(closest,self.activelayer());
          self.edges.push(nedg);
          self.activelayer(nedg);
        }
      }
    }
    self.spos(null);
  });
  self.deleteObject = function() {
    self.nodes.remove(self.activelayer());
    self.edges.remove(self.activelayer());
    for (var i=self.edges().length-1;i>=0;i--) {
      if (self.edges()[i].a == self.activelayer() || self.edges()[i].b == self.activelayer()) {
        self.edges.remove(self.edges()[i]);
      }
    }
    self.activelayer(null);
  }
  self.addMode = function() {
    self.mode = 'add';
  }
  self.drawMode = function() {
    self.mode = 'draw';
  }
  self.editMode = function() {
    self.mode = 'edit';
  }
  self.deleteMode = function() {
    self.mode = 'delete';
  }
  // dblclickinside($("#target"),function(x,y){self.activelayer().doubleclick(x,y);});
  // draginside($("#timeline"),function(x,y){
  // },function(x,y){
  // },function(x,y){
  // });

  // scrollinside($("#target"));
}
ko.applyBindings(justice);






