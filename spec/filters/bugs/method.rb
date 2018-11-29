opal_filter "Method" do
  fails "Method#== missing methods returns true for the same method missing"
  fails "Method#== returns true if a method was defined using the other one"
  fails "Method#== returns true if methods are the same"
  fails "Method#== returns true if the two core methods are aliases"
  fails "Method#== returns true on aliased methods"
  fails "Method#=== for a Method generated by respond_to_missing? does not call the original method name even if it now exists" # NameError: undefined method `handled_via_method_missing' for class `MethodSpecs::Methods'
  fails "Method#=== for a Method generated by respond_to_missing? invokes method_missing dynamically" # NameError: undefined method `handled_via_method_missing' for class `MethodSpecs::Methods'
  fails "Method#=== for a Method generated by respond_to_missing? invokes method_missing with the method name and the specified arguments" # NameError: undefined method `handled_via_method_missing' for class `MethodSpecs::Methods'
  fails "Method#=== for a Method generated by respond_to_missing? invokes method_missing with the specified arguments and returns the result" # NameError: undefined method `handled_via_method_missing' for class `MethodSpecs::Methods'
  fails "Method#=== invokes the method with the specified arguments, returning the method's return value" # Expected false to equal 15
  fails "Method#=== raises an ArgumentError when given incorrect number of arguments" # Expected ArgumentError but no exception was raised (false was returned)
  fails "Method#[] for a Method generated by respond_to_missing? does not call the original method name even if it now exists"
  fails "Method#[] for a Method generated by respond_to_missing? invokes method_missing dynamically"
  fails "Method#[] for a Method generated by respond_to_missing? invokes method_missing with the method name and the specified arguments"
  fails "Method#[] for a Method generated by respond_to_missing? invokes method_missing with the specified arguments and returns the result"
  fails "Method#arity for a Method generated by respond_to_missing? returns -1"
  fails "Method#call for a Method generated by respond_to_missing? does not call the original method name even if it now exists"
  fails "Method#call for a Method generated by respond_to_missing? invokes method_missing dynamically"
  fails "Method#call for a Method generated by respond_to_missing? invokes method_missing with the method name and the specified arguments"
  fails "Method#call for a Method generated by respond_to_missing? invokes method_missing with the specified arguments and returns the result"
  fails "Method#clone returns a copy of the method"
  fails "Method#curry returns a curried proc"
  fails "Method#curry with optional arity argument raises ArgumentError when the method requires less arguments than the given arity"
  fails "Method#curry with optional arity argument raises ArgumentError when the method requires more arguments than the given arity"
  fails "Method#curry with optional arity argument returns a curried proc when given correct arity"
  fails "Method#define_method when passed a Proc object and a method is defined inside defines the nested method in the default definee where the Proc was created" # Expected #<#<Class:0x3753c>:0x37538> NOT to have method 'nested_method_in_proc_for_define_method' but it does
  fails "Method#define_method when passed an UnboundMethod object defines a method with the same #arity as the original"
  fails "Method#define_method when passed an UnboundMethod object defines a method with the same #parameters as the original"
  fails "Method#eql? missing methods returns true for the same method missing"
  fails "Method#eql? returns true if a method was defined using the other one"
  fails "Method#eql? returns true if methods are the same"
  fails "Method#eql? returns true if the two core methods are aliases"
  fails "Method#eql? returns true on aliased methods"
  fails "Method#hash returns the same value for builtin methods that are eql?"
  fails "Method#hash returns the same value for user methods that are eql?"
  fails "Method#name for a Method generated by respond_to_missing? returns the name passed to respond_to_missing?"
  fails "Method#owner for a Method generated by respond_to_missing? returns the owner of the method"
  fails "Method#parameters returns [[:rest]] for a Method generated by respond_to_missing?"
  fails "Method#receiver for a Method generated by respond_to_missing? returns the receiver of the method"
  fails "Method#source_location for a Method generated by respond_to_missing? returns nil"
  fails "Method#source_location sets the first value to the path of the file in which the method was defined" # Expected "ruby/core/method/fixtures/classes.rb" to equal "./ruby/core/method/fixtures/classes.rb"
  fails "Method#source_location works for methods defined with a block"
  fails "Method#source_location works for methods defined with an UnboundMethod"
  fails "Method#super_method returns nil when the parent's method is removed"
  fails "Method#super_method returns nil when there's no super method in the parent"
  fails "Method#super_method returns the method that would be called by super in the method"
  fails "Method#to_proc returns a proc that can be used by define_method"
  fails "Method#to_proc returns a proc that can receive a block"
  fails "Method#to_proc returns a proc whose binding has the same receiver as the method" # NoMethodError: undefined method `receiver' for nil
  fails "Method#to_s returns a String containing the Module the method is defined in"
  fails "Method#to_s returns a String containing the Module the method is referenced from"
  fails "Method#to_s returns a String containing the method name"
  fails "Method#unbind rebinding UnboundMethod to Method's obj produces exactly equivalent Methods"
end
